# Submission Note

I focused the test suite on observable API behavior and separated unit tests for the task service from integration tests for the Express routes. The tests cover the happy path for every endpoint as well as validation, missing resources, pagination, assignment conflicts, and overdue statistics.

One thing that surprised me was how easy it was for a small business-rule bug in the statistics calculation to go unnoticed without a targeted regression test: completed tasks with old due dates were being counted as overdue.

If I had more time, I would test concurrency, date/timezone boundaries, malformed requests, authorization, persistence behavior, and production-level concerns such as rate limiting and structured logging.

Before shipping, I would clarify the assignment/reassignment rules, authentication/authorization requirements, timezone semantics for overdue tasks, persistence expectations, and the desired pagination response contract.
