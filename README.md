# Pyramid

A task and project management workspace — Kanban board, grouped list view, and a
full task detail screen with subtasks, threaded comments and an activity log.

Built as a two-service monorepo: a **Next.js** client and a **NestJS + MongoDB**
API, written in TypeScript end to end.

---

## Contents

- [Running it](#running-it)
- [Repository layout](#repository-layout)
- [Architecture](#architecture)
  - [Backend](#backend)
  - [Frontend](#frontend)
- [Data model](#data-model)
- [API reference](#api-reference)
- [Design system and theming](#design-system-and-theming)
- [Responsive behaviour](#responsive-behaviour)
- [Testing](#testing)
- [Deployment](#deployment)
- [Deviations from the Figma specification](#deviations-from-the-figma-specification)

---

## Running it

**Prerequisites:** Node 20.11+, and a MongoDB instance (local, Docker or Atlas).

```bash
# 1. install both workspaces from the repo root
npm install

# 2. configure each service
cp backend/.env.example  backend/.env
cp frontend/.env.example frontend/.env

# 3. start MongoDB (skip if you already have one)
docker compose up -d mongo

# 4. run the client and the API together
npm run dev
```

- Client → <http://localhost:3000>
- API → <http://localhost:3001/api>
- Interactive API reference → <http://localhost:3001/api/docs>

The API seeds a demo workspace on first boot when the database is empty
(`SEED_ON_BOOT=true`). To reseed on demand:

```bash
npm run seed              # no-op if a workspace already exists
npm run seed -- --force   # wipe and repopulate
```

Sign in with **Continue as Guest** — no account needed. Google OAuth also works
once `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` are set (redirect URI
`http://localhost:3000/api/auth/callback/google`).

### Everything in Docker

```bash
docker compose up --build
```

Brings up MongoDB, the API and the client together.

### Useful scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Client + API with hot reload |
| `npm run build` | Production build of both workspaces |
| `npm start` | Run both production builds |
| `npm run lint` | ESLint across both workspaces (zero warnings allowed) |
| `npm run typecheck` | `tsc --noEmit` across both workspaces |
| `npm test` | Backend unit + integration suites |
| `npm run seed` | Populate the demo workspace |

---

## Repository layout

```
.
├── frontend/                     Next.js 15 App Router client
│   ├── src/
│   │   ├── app/                  Routes only — thin, no business logic
│   │   │   ├── (auth)/sign-in/
│   │   │   ├── (workspace)/      Screens inside the app shell
│   │   │   └── (account)/settings/
│   │   ├── features/             Vertical slices, one folder per capability
│   │   │   ├── tasks/            api · hooks · components · task-detail
│   │   │   ├── projects/
│   │   │   ├── workspace-shell/
│   │   │   ├── settings/
│   │   │   └── auth/
│   │   ├── shared/               Cross-feature kernel
│   │   │   ├── ui/               Presentational primitives
│   │   │   ├── hooks/            Behavioural primitives
│   │   │   ├── lib/              HTTP client, dates, cookies, class helper
│   │   │   └── domain/           Types and enums mirroring the API contract
│   │   ├── providers/            Session · identity · theme · toasts
│   │   ├── styles/               Design tokens and base layer
│   │   └── middleware.ts         Edge route gate
│   └── Dockerfile
│
├── backend/                      NestJS API
│   ├── src/
│   │   ├── main.ts               Entry point
│   │   ├── application.module.ts Composition root
│   │   ├── bootstrap/            App configuration + OpenAPI setup
│   │   ├── config/               Zod-validated env, exposed as typed namespaces
│   │   ├── domains/              One folder per bounded context
│   │   │   ├── members/          schema · repository · service · controller · presenter · dto
│   │   │   ├── projects/
│   │   │   ├── tasks/
│   │   │   ├── discussions/      Comments
│   │   │   ├── taxonomy/         Labels
│   │   │   └── activity/         Audit stream
│   │   ├── infrastructure/       Database connection, health probes
│   │   ├── seeding/              Demo data blueprint + seeder + CLI
│   │   ├── shared/               Errors, HTTP kernel, base repository, utils
│   │   └── testing/              Integration suite
│   └── Dockerfile
│
├── docker-compose.yml
└── package.json                  npm workspaces root
```

---

## Architecture

### Backend

Each domain is a self-contained NestJS module with the same five layers, so any
one of them can be read without learning a new shape:

```
controller   HTTP surface — routing, status codes, OpenAPI annotations
   ↓
dto          Request contract — class-validator rules, the only trust boundary
   ↓
service      Business rules; throws domain errors, never HTTP exceptions
   ↓
repository   Persistence seam over Mongoose; no business logic
   ↓
presenter    Wire format; the only thing allowed to serialise a document
```

Decisions worth calling out:

**Domain errors, not HTTP exceptions.** Services throw `ResourceNotFoundError`,
`ConflictingStateError` and friends. A single `ErrorResponseFilter` decides what
status each deserves and emits one envelope:

```jsonc
{ "error": { "code": "RESOURCE_NOT_FOUND", "message": "…", "details": {} },
  "meta":  { "path": "/api/tasks/…", "method": "GET", "requestId": "…" } }
```

The services stay portable — the same code would work behind a queue consumer.

**A repository seam.** `MongoRepository<T>` provides the shared read/write verbs
and each domain extends it with its own query builders. Driver syntax (`$set`,
`bulkWrite`, populate chains) never leaks into a service.

**Presenters own the wire format.** `_id` becomes `id`, populated refs collapse
into small reference objects, and label documents flatten to an array of names.
The client receives data it can render directly, with no reshaping.

**Event-driven activity.** Mutations announce what happened on the event bus;
`ActivityRecorder` persists it out of band. A failed audit write can never turn
a successful task update into a 500, and adding a second listener (notifications,
webhooks) touches nothing in the task domain.

**Config validated at boot.** A Zod schema coerces and defaults every variable
and fails the process on a bad value, rather than surfacing it as a 500 an hour
later. Config is then exposed as three typed namespaces (`runtime`,
`persistence`, `security`) instead of stringly-typed lookups.

**Operational basics.** Helmet, compression, CORS allow-list, rate limiting,
correlation ids on every request and response, structured access logs, graceful
shutdown, and separate liveness/readiness probes — the readiness probe checks
Mongo, the liveness probe deliberately does not.

### Frontend

Organised as **feature slices** over a **shared kernel**. A route file does
nothing but pick a feature component; features own their data access, state and
presentation; anything used by two features moves down into `shared/`.

**One HTTP client.** `apiClient` is the only place that calls `fetch`. It
encodes query strings, unwraps the `{ data, meta }` envelope, and translates
failures into a typed `ApiError`.

**Behaviour as composable hooks.** `useDismissable` (click-outside + Escape),
`useAsyncResource` (loading / error / abort), `useHotkey`, `useSearchField` and
`useViewportMatch` hold the interaction logic, so components stay declarative
and every menu, panel and screen behaves the same way for pointer and keyboard
users alike.

**Optimistic where it matters.** Dragging a card updates local state
immediately, then reconciles with the server; if the write fails the prior order
is restored and a toast explains why.

**Theme without re-rendering.** Light/dark and the six accent modes are pure CSS
custom properties toggled on `<html>`. An inline script in the document head
applies the stored choice before first paint, so a reload never flashes the
wrong theme.

---

## Data model

MongoDB, modelled for how the screens actually read — not as a translated
relational schema.

| Collection | Notes |
| --- | --- |
| `members` | Unique email. Carries a generated `avatarUrl` and `initials`. `origin` distinguishes guest / federated / seeded. |
| `projects` | Optional `lead` reference. Soft-deleted via `archivedAt`. |
| `tasks` | `assignee`, `reporter`, `project` references, `labels: ObjectId[]`, and an **embedded** `checklist` array. |
| `labels` | Slug-keyed taxonomy; tasks reference them by id. |
| `comments` | Own collection, indexed on `task`, with one level of `parent` threading. |
| `activities` | Append-only audit stream; TTL index expires entries after 180 days. |

Two modelling choices carry the design:

- **Subtasks are embedded.** They are only read through their parent, they are
  few, and they die with it. A task therefore arrives complete in one document
  instead of needing a join per read.
- **Comments are not.** They are unbounded — a busy task can accumulate
  hundreds — so embedding them would grow the task document on every read.

Indexes are declared for the access patterns the UI actually has: board reads
(`archivedAt + state + boardOrder`), project detail (`project + archivedAt`),
comment threads (`task + createdAt`) and text search on titles.

Manual board ordering uses **sparse `boardOrder` values** (1000, 2000, 3000…),
so a card dropped between two neighbours takes the midpoint rather than
renumbering the column.

---

## API reference

Interactive docs are generated from the DTO decorators and served at
`/api/docs`, so the reference cannot drift from what the validators enforce.

List endpoints answer with `{ data, meta }`; single resources are returned bare.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/tasks` | List with search, state/priority/label/project/assignee filters, pagination |
| `POST` | `/api/tasks` | Create (label names are resolved into the taxonomy) |
| `GET` | `/api/tasks/:id` | Single task with assignee, project, labels, checklist |
| `PATCH` | `/api/tasks/:id` | Partial update; each field change is narrated to the activity stream |
| `DELETE` | `/api/tasks/:id` | Archive (soft delete) |
| `PUT` | `/api/tasks/board/placement` | Persist a drag by declaring a column's new order |
| `POST` | `/api/tasks/:id/checklist` | Append a subtask |
| `PATCH` | `/api/tasks/:id/checklist/:itemId` | Edit or tick off a subtask |
| `DELETE` | `/api/tasks/:id/checklist/:itemId` | Remove a subtask |
| `GET/POST/PATCH/DELETE` | `/api/projects…` | Project CRUD, with optional progress tallies |
| `GET/POST/PATCH/DELETE` | `/api/comments…` | Threads, replies, edits |
| `GET/POST/DELETE` | `/api/labels…` | Workspace taxonomy |
| `GET` | `/api/members`, `/api/members/:id` | Member directory |
| `POST` | `/api/members/guest-session` | Mint a fresh guest member |
| `POST` | `/api/members/federated-sync` | Upsert the member behind an OAuth identity |
| `PATCH` | `/api/members/:id` | Update profile; `avatarSeed` regenerates the portrait |
| `GET` | `/api/activity?taskId=` | Newest-first audit stream for a task |
| `GET` | `/api/health/live`, `/api/health/ready` | Probes |

---

## Design system and theming

Every colour in the product resolves through a token defined once in
`frontend/src/styles/design-tokens.css` and registered with Tailwind, so
components write `bg-surface`, `text-secondary`, `border-default` rather than hex
values.

- **Theme** — light and dark, applied as a `dark` class on `<html>`.
- **Accent** — six modes (`amber`, `blue`, `pink`, `rose`, `emerald`, `black`),
  applied as `data-color-mode`. Independent of light/dark, so the two preferences
  compose rather than multiplying into twelve themes. `black` inverts in dark mode
  so the accent stays visible.
- **Persistence** — both choices survive a refresh via `localStorage`, and are
  applied before first paint.

Reusable primitives live in `shared/ui`: `MemberAvatar`, `PriorityMeter`,
`ModalShell`, `PageHeader`, `CollapsibleSection`, `FacetFilterMenu`, the
`controls` set (icon/outline/primary buttons, search, text and select fields) and
the chip family. The task list's columns are described as data
(`table-columns.tsx`), so the Fields menu can toggle any of them without adding a
branch to the JSX.

---

## Responsive behaviour

- **< 1024px** — the sidebar becomes a slide-in drawer with a scrim, and closes
  on navigation.
- **< 640px** — list tables restack into cards with per-cell labels; board
  columns scroll horizontally with snap points; secondary toolbar actions
  collapse behind an overflow button.
- The task detail screen switches from a two-column layout to a single stacked
  column, with the properties rail below the content.
- `prefers-reduced-motion` is honoured globally.

---

## Testing

```bash
npm test              # everything
npm run test:unit -w backend    # unit only, no database
```

- **Unit tests** cover the pure logic — deterministic avatar generation, the
  display-date parser, and activity narration.
- **Integration tests** (`backend/src/testing/`) boot the *real* module graph —
  controllers, validation pipe, repositories, Mongoose schemas, the event bus —
  against an ephemeral MongoDB via `mongodb-memory-server`. Nothing is mocked.
  They cover the full task lifecycle, board placement, checklists, comment
  threading, the seeder, and the error envelope.

The integration suite shares `configureApplication()` with `main.ts`, so the
tests exercise the same pipeline the server runs rather than a simplified one.

---

## Deployment

The two services deploy independently.

**Client** — any Next.js host (Vercel, Netlify, a container). Set:

```
NEXT_PUBLIC_API_BASE_URL=https://your-api-host
AUTH_SECRET=…            # npx auth secret
AUTH_TRUST_HOST=true
GOOGLE_CLIENT_ID=…
GOOGLE_CLIENT_SECRET=…
```

The browser only ever calls same-origin `/api/*`; Next rewrites those to the API,
so there is no CORS preflight in the hot path and the API host is a deploy-time
setting rather than something baked into the bundle.

**API** — any container host (Render, Railway, Fly, Cloud Run). Set:

```
MONGODB_URI=mongodb+srv://…
CORS_ALLOWED_ORIGINS=https://your-client-host
NODE_ENV=production
SEED_ON_BOOT=false       # keep production data under your control
```

Both Dockerfiles are multi-stage, build from the repo root so the workspace
manifests resolve, and run as a non-root user. The API image ships a
`HEALTHCHECK` pointed at the liveness probe.

---

## Deviations from the Figma specification

Documented as required by the brief.

1. **Account dropdown "Black" swatch.** The spec shows an uncoloured swatch for
   the Black accent. It is rendered with a real `#18181B` swatch, and inverted to
   white in dark mode — otherwise the accent is invisible against the dark page.

2. **Comments section heading.** The mock repeats the "Subtasks" heading above
   the comment thread, which reads as a copy-paste artefact. The second section
   is rendered without a duplicate heading.

3. **Projects page call to action.** The Figma labels the primary button on the
   Projects screen "+ Add Task". Corrected to "+ Add Project".

4. **Project detail structure.** Interpreted per the brief — identical structure
   to the global Tasks list view, scoped to one project, with breadcrumbs above
   the header.

5. **Avatars.** The mock reuses one stock portrait for every member, which is a
   placeholder rather than a specification — repeated across an eight-person
   board it stops carrying information. Each member is instead given a distinct,
   deterministic portrait derived from their email, with an initials disc as the
   offline fallback.

6. **Members / Teams / Watchers.** Member assignment beyond the current user,
   the Teams chips, and the watcher count are rendered as the design shows them
   but are not backed by a picker — team management is outside the scope of this
   brief. Labels, dates, status and priority in the same panel are all fully
   editable.

7. **"Resources" panel.** Rendered as the empty affordance the design shows;
   file attachment is out of scope.

---

## Interactions the design implies

A static mock can only show a state, not a behaviour. These were built by
reading what each screen is clearly meant to do:

- **Drag and drop on the board.** Cards move between columns and reorder within
  one, persisted through an idempotent placement endpoint. The grab handle and
  column layout in the design only make sense if the cards actually move.
- **A live activity stream.** The "Updates" panel reads from an append-only
  audit log rather than fixed copy, and the sentence is composed server-side so
  any future client — a digest email, a Slack hook — words it identically.
- **Subtasks and threaded comments.** Subtasks are embedded documents you can
  add, tick off and delete. Comments support the one-level replies that the
  design's "Leave a reply…" field under each comment implies.
- **Filtering.** The filter control drives real server-side filtering on status
  and priority, with the selection reflected in the trigger.
- **Per-visitor guest sessions,** so two people can try the demo at the same
  time and see themselves as distinct authors with distinct avatars.
- **An editable profile.** Name, title and username persist on blur, and the
  generated portrait can be re-rolled.
- **⌘F / Ctrl-F** expands and focuses search — the design draws the badge, so
  the shortcut should exist.
- **Toasts, error states and retry,** so a failed request is visibly different
  from an empty result.
