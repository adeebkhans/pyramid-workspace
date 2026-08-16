import 'reflect-metadata';

import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

/**
 * Integration coverage for the whole HTTP surface.
 *
 * Runs the real module graph — controllers, validation pipe, repositories,
 * Mongoose schemas, the event bus — against an ephemeral MongoDB. Nothing is
 * mocked, so a broken populate path or a mis-declared index fails here rather
 * than in production.
 *
 * The environment is prepared before the module is imported because
 * `ConfigModule` validates `process.env` at class-load time.
 */
describe('Pyramid API', () => {
  let mongo: MongoMemoryServer;
  let app: INestApplication;
  let http: request.Agent;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();

    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = mongo.getUri('pyramid-test');
    process.env.SEED_ON_BOOT = 'false';
    process.env.SWAGGER_ENABLED = 'false';
    process.env.LOG_LEVEL = 'error';

    const { ApplicationModule } = await import('@pyramid/application.module');
    const { configureApplication } = await import('@pyramid/bootstrap/configure-application');

    const moduleRef = await Test.createTestingModule({ imports: [ApplicationModule] }).compile();

    app = moduleRef.createNestApplication({ logger: false });
    configureApplication(app);
    await app.init();

    http = request(app.getHttpServer());
  }, 120_000);

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  // ── health ───────────────────────────────────────────────────────────────

  it('answers the liveness probe without touching the database', async () => {
    const response = await http.get('/api/health/live').expect(200);
    expect(response.body.status).toBe('ok');
  });

  // ── members ──────────────────────────────────────────────────────────────

  describe('guest sessions', () => {
    it('mints a distinct member, with its own generated avatar, on every call', async () => {
      const first = await http.post('/api/members/guest-session').expect(201);
      const second = await http.post('/api/members/guest-session').expect(201);

      expect(first.body.id).not.toBe(second.body.id);
      expect(first.body.email).not.toBe(second.body.email);
      expect(first.body.avatarUrl).not.toBe(second.body.avatarUrl);
      expect(first.body.isGuest).toBe(true);
      expect(first.body.initials).toHaveLength(2);
    });
  });

  describe('federated sync', () => {
    it('is idempotent by email', async () => {
      const payload = { name: 'Priya Raman', email: 'priya@example.com' };

      const created = await http.post('/api/members/federated-sync').send(payload).expect(200);
      const repeated = await http
        .post('/api/members/federated-sync')
        .send({ ...payload, name: 'Priya R.' })
        .expect(200);

      expect(repeated.body.id).toBe(created.body.id);
      expect(repeated.body.name).toBe('Priya R.');
    });
  });

  // ── the full task lifecycle ──────────────────────────────────────────────

  describe('task lifecycle', () => {
    let actorId: string;
    let projectId: string;
    let taskId: string;

    beforeAll(async () => {
      const member = await http.post('/api/members/guest-session').expect(201);
      actorId = member.body.id;

      const project = await http
        .post('/api/projects')
        .send({ title: 'Design Homepage', priority: 'High', dueDate: '12 Sep 2026', leadId: actorId })
        .expect(201);
      projectId = project.body.id;
    });

    it('creates a task, resolving label names into the taxonomy', async () => {
      const response = await http
        .post(`/api/tasks?actorId=${actorId}`)
        .send({
          title: 'Write API documentation',
          state: 'To Do',
          priority: 'Medium',
          projectId,
          assigneeId: actorId,
          labels: ['Design', 'Backend'],
          dueDate: '29 Jul 2026',
        })
        .expect(201);

      taskId = response.body.id;

      expect(response.body.project).toEqual({ id: projectId, title: 'Design Homepage' });
      expect(response.body.assignee.id).toBe(actorId);
      expect(response.body.labels.sort()).toEqual(['Backend', 'Design']);
    });

    it('returns list results in the { data, meta } envelope', async () => {
      const response = await http.get('/api/tasks').expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toMatchObject({ page: 1, total: expect.any(Number) });
    });

    it('filters by state and priority', async () => {
      const matching = await http.get('/api/tasks?state=To Do&priority=Medium').expect(200);
      const excluded = await http.get('/api/tasks?state=Completed').expect(200);

      expect(matching.body.data).toHaveLength(1);
      expect(excluded.body.data).toHaveLength(0);
    });

    it('records a narrated activity entry when a field changes', async () => {
      await http.patch(`/api/tasks/${taskId}?actorId=${actorId}`).send({ priority: 'Urgent' }).expect(200);

      // The recorder listens asynchronously; give the event loop a turn.
      await new Promise((resolve) => setTimeout(resolve, 50));

      const stream = await http.get(`/api/activity?taskId=${taskId}`).expect(200);
      const change = stream.body.find(
        (entry: { verb: string }) => entry.verb === 'task.priority-changed',
      );

      expect(change).toBeDefined();
      expect(change.summary).toBe('changed priority from Medium to Urgent');
      expect(change.actor.id).toBe(actorId);
    });

    it('persists a board drop by declaring the destination order', async () => {
      await http
        .put(`/api/tasks/board/placement?actorId=${actorId}`)
        .send({ state: 'Doing', orderedIds: [taskId] })
        .expect(204);

      const moved = await http.get(`/api/tasks/${taskId}`).expect(200);

      expect(moved.body.state).toBe('Doing');
      expect(moved.body.boardOrder).toBe(1_000);
    });

    it('adds and ticks off an embedded checklist item', async () => {
      const added = await http
        .post(`/api/tasks/${taskId}/checklist?actorId=${actorId}`)
        .send({ title: 'Draft the overview', priority: 'High' })
        .expect(201);

      expect(added.body.checklist).toHaveLength(1);
      const itemId = added.body.checklist[0].id;

      const ticked = await http
        .patch(`/api/tasks/${taskId}/checklist/${itemId}?actorId=${actorId}`)
        .send({ completed: true })
        .expect(200);

      expect(ticked.body.checklist[0].completed).toBe(true);
    });

    it('nests replies under their parent comment', async () => {
      const root = await http
        .post('/api/comments')
        .send({ body: 'Looks good to me.', taskId, authorId: actorId })
        .expect(201);

      await http
        .post('/api/comments')
        .send({ body: 'Agreed — merging.', taskId, authorId: actorId, parentId: root.body.id })
        .expect(201);

      const thread = await http.get(`/api/comments?taskId=${taskId}`).expect(200);

      expect(thread.body).toHaveLength(1);
      expect(thread.body[0].replies).toHaveLength(1);
      expect(thread.body[0].replies[0].body).toBe('Agreed — merging.');
      expect(thread.body[0].author.id).toBe(actorId);
    });

    it('archives rather than destroys', async () => {
      await http.delete(`/api/tasks/${taskId}?actorId=${actorId}`).expect(204);

      const visible = await http.get('/api/tasks').expect(200);
      expect(visible.body.data.some((task: { id: string }) => task.id === taskId)).toBe(false);

      // Still retrievable by id — the history has not been thrown away.
      await http.get(`/api/tasks/${taskId}`).expect(200);
    });
  });

  // ── contract enforcement ─────────────────────────────────────────────────

  describe('error envelope', () => {
    it('rejects an unknown workflow state', async () => {
      const response = await http.post('/api/tasks').send({ title: 'Nope', state: 'Someday' }).expect(400);
      expect(response.body.error.code).toBe('BAD_REQUEST');
    });

    it('rejects a malformed display date', async () => {
      const response = await http
        .post('/api/tasks')
        .send({ title: 'Nope', dueDate: '2026-09-12' })
        .expect(400);

      expect(response.body.error.details.join(' ')).toContain('12 Sep 2026');
    });

    it('rejects fields the contract never declared', async () => {
      await http.post('/api/tasks').send({ title: 'Nope', sneaky: true }).expect(400);
    });

    it('reports a malformed identifier as a bad request', async () => {
      const response = await http.get('/api/tasks/not-an-object-id').expect(400);
      expect(response.body.error.code).toBe('INVALID_IDENTIFIER');
    });

    it('reports a missing resource as not found', async () => {
      const response = await http.get('/api/tasks/000000000000000000000000').expect(404);
      expect(response.body.error.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('stamps every response with a correlation id', async () => {
      const response = await http.get('/api/labels').expect(200);
      expect(response.headers['x-request-id']).toBeDefined();
    });
  });

  // ── seeding ──────────────────────────────────────────────────────────────

  describe('workspace seeder', () => {
    it('populates a demo workspace and refuses to duplicate it', async () => {
      const { WorkspaceSeeder } = await import('@pyramid/seeding/workspace.seeder');
      const seeder = app.get(WorkspaceSeeder);

      // `force` clears first, so the assertion holds even though earlier tests
      // have already written to this database.
      const first = await seeder.run({ force: true });
      expect(first.skipped).toBe(false);
      expect(first.members).toBeGreaterThan(0);
      expect(first.tasks).toBeGreaterThan(0);

      const second = await seeder.run();
      expect(second.skipped).toBe(true);
    }, 60_000);

    it('gives every seeded member a distinct portrait', async () => {
      const members = await http.get('/api/members?origin=seeded').expect(200);
      const portraits = new Set(members.body.data.map((member: { avatarUrl: string }) => member.avatarUrl));

      expect(members.body.data.length).toBeGreaterThan(1);
      expect(portraits.size).toBe(members.body.data.length);
    });

    it('seeds tasks with populated relations, labels and checklists', async () => {
      const tasks = await http.get('/api/tasks?pageSize=50').expect(200);
      const withChecklist = tasks.body.data.find(
        (task: { checklist: unknown[] }) => task.checklist.length > 0,
      );

      expect(withChecklist).toBeDefined();
      expect(withChecklist.assignee).not.toBeNull();
      expect(withChecklist.project).not.toBeNull();
      expect(withChecklist.labels.length).toBeGreaterThan(0);
      expect(withChecklist.checklist[0].assignee).not.toBeNull();
    });
  });
});
