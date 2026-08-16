const request = require("supertest");
const app = require("../src/app");
const service = require("../src/taskService");

describe("Task API integration", () => {
  beforeEach(() => {
    service.resetStore();
  });

  // ============================================================
  // GET /tasks
  // ============================================================

  describe("GET /tasks", () => {
    test("returns all tasks", async () => {
      await request(app).post("/tasks").send({ title: "Task A" });
      await request(app).post("/tasks").send({ title: "Task B" });

      const res = await request(app).get("/tasks");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].title).toBe("Task A");
      expect(res.body[1].title).toBe("Task B");
    });

    test("returns empty array when there are no tasks", async () => {
      const res = await request(app).get("/tasks");

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    test("filters tasks by status", async () => {
      await request(app)
        .post("/tasks")
        .send({
          title: "Todo Task",
          status: "todo"
        });

      await request(app)
        .post("/tasks")
        .send({
          title: "Done Task",
          status: "done"
        });

      await request(app)
        .post("/tasks")
        .send({
          title: "Progress Task",
          status: "in_progress"
        });

      const res = await request(app).get("/tasks?status=todo");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe("Todo Task");
      expect(res.body[0].status).toBe("todo");
    });

    test("filters in_progress tasks", async () => {
      await request(app)
        .post("/tasks")
        .send({
          title: "Progress Task",
          status: "in_progress"
        });

      await request(app)
        .post("/tasks")
        .send({
          title: "Todo Task",
          status: "todo"
        });

      const res = await request(app).get("/tasks?status=in_progress");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].status).toBe("in_progress");
    });

    test("rejects invalid status", async () => {
      const res = await request(app).get("/tasks?status=invalid");

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Invalid status/);
    });

    test("supports pagination", async () => {
      await request(app).post("/tasks").send({ title: "Task A" });
      await request(app).post("/tasks").send({ title: "Task B" });
      await request(app).post("/tasks").send({ title: "Task C" });

      const res = await request(app).get("/tasks?page=2&limit=2");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe("Task C");
    });

    test("returns empty array when requested page has no tasks", async () => {
      await request(app).post("/tasks").send({ title: "Task A" });

      const res = await request(app).get("/tasks?page=10&limit=10");

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    test("rejects invalid pagination", async () => {
      const res = await request(app).get("/tasks?page=0&limit=10");

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/page must be >= 1/);
    });

    test("rejects limit greater than 100", async () => {
      const res = await request(app).get("/tasks?page=1&limit=101");

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/limit must be between 1 and 100/);
    });
  });

  // ============================================================
  // POST /tasks
  // ============================================================

  describe("POST /tasks", () => {
    test("creates a new task", async () => {
      const res = await request(app)
        .post("/tasks")
        .send({
          title: "Build tests",
          description: "Write Jest and Supertest tests",
          priority: "high"
        });

      expect(res.status).toBe(201);

      expect(res.body).toMatchObject({
        title: "Build tests",
        description: "Write Jest and Supertest tests",
        priority: "high",
        status: "todo",
        dueDate: null,
        completedAt: null
      });

      expect(res.body.id).toEqual(expect.any(String));
      expect(res.body.createdAt).toEqual(expect.any(String));
    });

    test("creates task with default values", async () => {
      const res = await request(app)
        .post("/tasks")
        .send({
          title: "Simple Task"
        });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe("Simple Task");
      expect(res.body.description).toBe("");
      expect(res.body.status).toBe("todo");
      expect(res.body.priority).toBe("medium");
      expect(res.body.dueDate).toBeNull();
      expect(res.body.completedAt).toBeNull();
    });

    test("trims whitespace from title", async () => {
      const res = await request(app)
        .post("/tasks")
        .send({
          title: "   Learn Jest   "
        });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe("Learn Jest");
    });

    test("rejects missing title", async () => {
      const res = await request(app)
        .post("/tasks")
        .send({
          description: "Task without title"
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/title is required/);
    });

    test("rejects empty title", async () => {
      const res = await request(app)
        .post("/tasks")
        .send({
          title: "   "
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/title is required/);
    });

    test("rejects invalid priority", async () => {
      const res = await request(app)
        .post("/tasks")
        .send({
          title: "Invalid Priority",
          priority: "urgent"
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/priority must be one of/);
    });

    test("rejects invalid status", async () => {
      const res = await request(app)
        .post("/tasks")
        .send({
          title: "Invalid Status",
          status: "blocked"
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/status must be one of/);
    });

    test("creates a completed task with completedAt", async () => {
      const res = await request(app)
        .post("/tasks")
        .send({
          title: "Already Done",
          status: "done"
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("done");
      expect(res.body.completedAt).toEqual(expect.any(String));
    });
  });

  // ============================================================
  // PUT /tasks/:id
  // ============================================================

  describe("PUT /tasks/:id", () => {
    test("updates an existing task", async () => {
      const created = await request(app)
        .post("/tasks")
        .send({
          title: "Old Title"
        });

      const res = await request(app)
        .put(`/tasks/${created.body.id}`)
        .send({
          title: "Updated Title",
          priority: "high"
        });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe("Updated Title");
      expect(res.body.priority).toBe("high");
    });

    test("updates task status to in_progress", async () => {
      const created = await request(app)
        .post("/tasks")
        .send({
          title: "Work Task"
        });

      const res = await request(app)
        .put(`/tasks/${created.body.id}`)
        .send({
          status: "in_progress"
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("in_progress");
      expect(res.body.completedAt).toBeNull();
    });

    test("updates task status to done", async () => {
      const created = await request(app)
        .post("/tasks")
        .send({
          title: "Finish Task"
        });

      const res = await request(app)
        .put(`/tasks/${created.body.id}`)
        .send({
          status: "done"
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("done");
      expect(res.body.completedAt).toEqual(expect.any(String));
    });

    test("returns 404 for a missing task", async () => {
      const res = await request(app)
        .put("/tasks/missing-id")
        .send({
          title: "Updated"
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Task not found");
    });

    test("rejects invalid update priority", async () => {
      const created = await request(app)
        .post("/tasks")
        .send({
          title: "Task"
        });

      const res = await request(app)
        .put(`/tasks/${created.body.id}`)
        .send({
          priority: "urgent"
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/priority must be one of/);
    });
  });

  // ============================================================
  // DELETE /tasks/:id
  // ============================================================

  describe("DELETE /tasks/:id", () => {
    test("deletes an existing task", async () => {
      const created = await request(app)
        .post("/tasks")
        .send({
          title: "Delete Me"
        });

      const res = await request(app)
        .delete(`/tasks/${created.body.id}`);

      expect(res.status).toBe(204);
      expect(res.body).toEqual({});

      const list = await request(app).get("/tasks");

      expect(list.status).toBe(200);
      expect(list.body).toHaveLength(0);
    });

    test("returns 404 for a missing task", async () => {
      const res = await request(app)
        .delete("/tasks/missing-id");

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Task not found");
    });
  });

  // ============================================================
  // PATCH /tasks/:id/complete
  // ============================================================

  describe("PATCH /tasks/:id/complete", () => {
    test("marks a task as completed", async () => {
      const created = await request(app)
        .post("/tasks")
        .send({
          title: "Complete Me"
        });

      const res = await request(app)
        .patch(`/tasks/${created.body.id}/complete`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("done");
      expect(res.body.completedAt).toEqual(expect.any(String));
    });

    test("returns 404 for a missing task", async () => {
      const res = await request(app)
        .patch("/tasks/missing-id/complete");

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Task not found");
    });

    test("completing an already completed task keeps it completed", async () => {
      const created = await request(app)
        .post("/tasks")
        .send({
          title: "Already Complete",
          status: "done"
        });

      const firstCompletedAt = created.body.completedAt;

      const res = await request(app)
        .patch(`/tasks/${created.body.id}/complete`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("done");
      expect(res.body.completedAt).toBe(firstCompletedAt);
    });
  });

  // ============================================================
  // GET /tasks/stats
  // ============================================================

  describe("GET /tasks/stats", () => {
    test("returns counts by status and overdue count", async () => {
      await request(app)
        .post("/tasks")
        .send({
          title: "Todo Task",
          status: "todo"
        });

      await request(app)
        .post("/tasks")
        .send({
          title: "Progress Task",
          status: "in_progress"
        });

      await request(app)
        .post("/tasks")
        .send({
          title: "Done Task",
          status: "done"
        });

      const res = await request(app).get("/tasks/stats");

      expect(res.status).toBe(200);

      expect(res.body).toEqual({
        todo: 1,
        in_progress: 1,
        done: 1,
        overdue: 0
      });
    });

    test("counts overdue unfinished tasks", async () => {
      await request(app)
        .post("/tasks")
        .send({
          title: "Overdue Todo",
          status: "todo",
          dueDate: "2020-01-01T00:00:00.000Z"
        });

      const res = await request(app).get("/tasks/stats");

      expect(res.status).toBe(200);

      expect(res.body).toEqual({
        todo: 1,
        in_progress: 0,
        done: 0,
        overdue: 1
      });
    });

    test("does not count completed overdue tasks", async () => {
      await request(app)
        .post("/tasks")
        .send({
          title: "Overdue Todo",
          status: "todo",
          dueDate: "2020-01-01T00:00:00.000Z"
        });

      await request(app)
        .post("/tasks")
        .send({
          title: "Overdue Done",
          status: "done",
          dueDate: "2020-01-01T00:00:00.000Z"
        });

      const res = await request(app).get("/tasks/stats");

      expect(res.status).toBe(200);

      expect(res.body).toEqual({
        todo: 1,
        in_progress: 0,
        done: 1,
        overdue: 1
      });
    });

    test("returns zero counts when there are no tasks", async () => {
      const res = await request(app).get("/tasks/stats");

      expect(res.status).toBe(200);

      expect(res.body).toEqual({
        todo: 0,
        in_progress: 0,
        done: 0,
        overdue: 0
      });
    });
  });

  // ============================================================
  // PATCH /tasks/:id/assign
  // ============================================================

  describe("PATCH /tasks/:id/assign", () => {
    test("assigns a task to an assignee", async () => {
      const created = await request(app)
        .post("/tasks")
        .send({
          title: "Assign Task"
        });

      const res = await request(app)
        .patch(`/tasks/${created.body.id}/assign`)
        .send({
          assignee: "Shubham Kumar"
        });

      expect(res.status).toBe(200);
      expect(res.body.assignee).toBe("Shubham Kumar");
      expect(res.body.id).toBe(created.body.id);
    });

    test("trims whitespace from assignee", async () => {
      const created = await request(app)
        .post("/tasks")
        .send({
          title: "Assign Task"
        });

      const res = await request(app)
        .patch(`/tasks/${created.body.id}/assign`)
        .send({
          assignee: "   Shubham Kumar   "
        });

      expect(res.status).toBe(200);
      expect(res.body.assignee).toBe("Shubham Kumar");
    });

    test("rejects an empty assignee", async () => {
      const created = await request(app)
        .post("/tasks")
        .send({
          title: "Assign Task"
        });

      const res = await request(app)
        .patch(`/tasks/${created.body.id}/assign`)
        .send({
          assignee: "   "
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/assignee must be a non-empty string/);
    });

    test("rejects a missing assignee", async () => {
      const created = await request(app)
        .post("/tasks")
        .send({
          title: "Assign Task"
        });

      const res = await request(app)
        .patch(`/tasks/${created.body.id}/assign`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/assignee must be a non-empty string/);
    });

    test("rejects a non-string assignee", async () => {
      const created = await request(app)
        .post("/tasks")
        .send({
          title: "Assign Task"
        });

      const res = await request(app)
        .patch(`/tasks/${created.body.id}/assign`)
        .send({
          assignee: 123
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/assignee must be a non-empty string/);
    });

    test("returns 404 when task does not exist", async () => {
      const res = await request(app)
        .patch("/tasks/missing-id/assign")
        .send({
          assignee: "Shubham Kumar"
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Task not found");
    });

    test("rejects reassignment of an already assigned task", async () => {
      const created = await request(app)
        .post("/tasks")
        .send({
          title: "Assign Task"
        });

      await request(app)
        .patch(`/tasks/${created.body.id}/assign`)
        .send({
          assignee: "First User"
        });

      const res = await request(app)
        .patch(`/tasks/${created.body.id}/assign`)
        .send({
          assignee: "Second User"
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already assigned/);
    });
  });

  // ============================================================
  // Unknown routes
  // ============================================================

  describe("Unknown routes", () => {
    test("returns 404 for an unknown route", async () => {
      const res = await request(app).get("/does-not-exist");

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Route not found");
    });
  });
});