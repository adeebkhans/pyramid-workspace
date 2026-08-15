import { describeActivity } from './activity.presenter';

describe('describeActivity', () => {
  it('narrates a priority change with both sides', () => {
    expect(describeActivity('task.priority-changed', { from: 'Low', to: 'Urgent' })).toBe(
      'changed priority from Low to Urgent',
    );
  });

  it('narrates a column move', () => {
    expect(describeActivity('task.state-changed', { from: 'To Do', to: 'Doing' })).toBe(
      'moved this task from To Do to Doing',
    );
  });

  it('distinguishes assigning from unassigning', () => {
    expect(describeActivity('task.assignee-changed', { to: 'Priya Raman' })).toBe(
      'assigned this task to Priya Raman',
    );
    expect(describeActivity('task.assignee-changed', { to: null })).toBe('removed the assignee');
  });

  it('reads sensibly when a side is missing', () => {
    expect(describeActivity('task.priority-changed', {})).toBe('changed priority from nothing to nothing');
  });
});
