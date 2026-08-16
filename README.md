# Task Manager API — Take-Home Assignment

Node.js + Express + Jest + Supertest implementation for **The Untested API**.

## Requirements

- Node.js 18+
- npm

## Run locally

```bash
npm install
npm start
```

API: `http://localhost:3000`

## Run tests

```bash
npm test
```

## Coverage

```bash
npm run coverage
```

The Jest configuration enforces 80% global coverage for branches, functions, lines, and statements.

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/tasks` | List all tasks |
| GET | `/tasks?status=todo` | Filter by status |
| GET | `/tasks?page=1&limit=10` | Paginated list |
| POST | `/tasks` | Create a task |
| PUT | `/tasks/:id` | Update a task |
| DELETE | `/tasks/:id` | Delete a task |
| PATCH | `/tasks/:id/complete` | Mark as complete |
| GET | `/tasks/stats` | Status counts + overdue count |
| PATCH | `/tasks/:id/assign` | Assign a task |

## Assignment feature

### Request

```http
PATCH /tasks/:id/assign
Content-Type: application/json

{
  "assignee": "Shubham Kumar"
}
```

### Behavior

- Valid non-empty string → stores `assignee` and returns updated task.
- Blank/non-string/missing value → `400`.
- Unknown task → `404`.
- Existing assignment → `409`.

## Test strategy

### Unit tests

`tests/taskService.test.js` tests business logic directly:
- task creation/defaults
- validation
- filtering
- pagination
- updates
- completion
- deletion
- assignment
- statistics

### Integration tests

`tests/app.test.js` uses Supertest against the Express application and verifies:
- happy paths for every endpoint
- validation failures
- missing resources
- pagination
- assignment conflicts
- unknown routes

## Bug found and fixed

The original stats implementation counted completed tasks with past due dates as overdue. A regression test catches this behavior. The submitted implementation excludes `done` tasks from the overdue count.

See `BUG_REPORT.md`.

## Suggested production questions

1. Should tasks have authentication and authorization?
2. Who is allowed to update, delete, complete, or assign tasks?
3. Should an existing assignee ever be replaceable?
4. What are the exact validation rules for title, description, dates, and pagination?
5. Should the API return pagination metadata such as total count and total pages?
6. Should task data persist across restarts?
7. What timezone should determine whether a task is overdue?
8. What logging, rate limiting, and monitoring are required before production?

## What I would test next

- Concurrent updates/assignment attempts.
- Malformed JSON and unsupported content types.
- Very large request bodies.
- Boundary values for pagination (`limit=1`, `limit=100`, `limit=101`).
- All date/timezone edge cases.
- Repeated completion calls and state transitions.
- Full end-to-end behavior with a persistent database.
- Error handling and request validation under load.
