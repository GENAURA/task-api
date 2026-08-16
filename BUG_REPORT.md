# Bug Report

## Bug 1 — Completed tasks were counted as overdue

**Expected behavior**

A task should be counted as overdue only when it has a due date in the past and is not completed. A task with `status: "done"` should not contribute to the overdue count.

**Actual behavior**

The original implementation counted every task whose `dueDate` was in the past, including completed tasks.

**How testing discovered it**

A service-level test created:
1. an overdue `todo` task, and
2. a completed `done` task with an old due date.

The test expected `overdue: 1`, but the original implementation returned `overdue: 2`.

**Fix**

Update the overdue condition to exclude completed tasks:

```js
if (
  task.status !== "done" &&
  task.dueDate &&
  Date.parse(task.dueDate) < Date.now()
) {
  overdue += 1;
}
```

The final submitted code contains this fix and the regression test remains in place.

## Validation choices for the new assignment feature

- Missing/non-string/blank `assignee` → `400 Bad Request`
- First valid assignment → `200 OK`
- Assigning an already assigned task → `409 Conflict`
- Unknown task ID → `404 Not Found`

This avoids silently overwriting an existing assignment.
