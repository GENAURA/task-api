const service = require("../src/taskService");

describe("taskService", () => {
  beforeEach(() => service.resetStore());

  describe("createTask", () => {
    test("creates a task with defaults", () => {
      const task = service.createTask({ title: "  Learn Jest  " });

      expect(task).toMatchObject({
        title: "Learn Jest",
        description: "",
        status: "todo",
        priority: "medium",
        dueDate: null,
        completedAt: null
      });
      expect(task.id).toEqual(expect.any(String));
      expect(task.createdAt).toEqual(expect.any(String));
    });

    test("creates a completed task with completedAt", () => {
      const task = service.createTask({ title: "Done", status: "done" });
      expect(task.completedAt).toEqual(expect.any(String));
    });

    test("rejects an empty title", () => {
      expect(() => service.createTask({ title: "   " })).toThrow(
        "title is required"
      );
    });

    test("rejects invalid priority", () => {
      expect(() =>
        service.createTask({ title: "Task", priority: "urgent" })
      ).toThrow("priority must be one of");
    });
  });

  describe("listTasks", () => {
    test("lists tasks and filters by status", () => {
      service.createTask({ title: "A", status: "todo" });
      service.createTask({ title: "B", status: "done" });

      expect(service.listTasks()).toHaveLength(2);
      expect(service.listTasks({ status: "done" })).toHaveLength(1);
      expect(service.listTasks({ status: "done" })[0].title).toBe("B");
    });

    test("paginates tasks", () => {
      service.createTask({ title: "A" });
      service.createTask({ title: "B" });
      service.createTask({ title: "C" });

      expect(service.listTasks({ page: 1, limit: 2 })).toHaveLength(2);
      expect(service.listTasks({ page: 2, limit: 2 })).toHaveLength(1);
    });

    test("rejects invalid pagination", () => {
      expect(() => service.listTasks({ page: 0, limit: 10 })).toThrow(
        "page must be >= 1"
      );
    });

    test("rejects an invalid status filter", () => {
      expect(() => service.listTasks({ status: "blocked" })).toThrow(
        "Invalid status"
      );
    });
  });

  describe("updateTask", () => {
    test("updates editable fields", () => {
      const task = service.createTask({ title: "Old" });
      const updated = service.updateTask(task.id, {
        title: "New",
        status: "in_progress",
        priority: "high"
      });

      expect(updated.title).toBe("New");
      expect(updated.status).toBe("in_progress");
      expect(updated.priority).toBe("high");
    });

    test("returns null for a missing task", () => {
      expect(service.updateTask("missing-id", { title: "X" })).toBeNull();
    });

    test("clears completedAt when moving out of done", () => {
      const task = service.createTask({ title: "Done", status: "done" });
      expect(task.completedAt).not.toBeNull();

      service.updateTask(task.id, { status: "todo" });
      expect(service.getTask(task.id).completedAt).toBeNull();
    });
  });

  describe("completeTask", () => {
    test("marks a task done", () => {
      const task = service.createTask({ title: "Finish" });
      const completed = service.completeTask(task.id);

      expect(completed.status).toBe("done");
      expect(completed.completedAt).toEqual(expect.any(String));
    });

    test("returns null for a missing task", () => {
      expect(service.completeTask("missing-id")).toBeNull();
    });
  });

  describe("deleteTask", () => {
    test("deletes an existing task", () => {
      const task = service.createTask({ title: "Delete me" });
      expect(service.deleteTask(task.id)).toBe(true);
      expect(service.getTask(task.id)).toBeNull();
    });

    test("returns false for a missing task", () => {
      expect(service.deleteTask("missing-id")).toBe(false);
    });
  });

  describe("assignTask", () => {
    test("assigns a task to a name", () => {
      const task = service.createTask({ title: "Review PR" });
      const updated = service.assignTask(task.id, "  Shubham  ");

      expect(updated.assignee).toBe("Shubham");
    });

    test("rejects an empty assignee", () => {
      const task = service.createTask({ title: "Review PR" });

      expect(() => service.assignTask(task.id, "   ")).toThrow(
        "assignee must be a non-empty string"
      );
    });

    test("rejects reassignment", () => {
      const task = service.createTask({ title: "Review PR" });
      service.assignTask(task.id, "A");

      expect(() => service.assignTask(task.id, "B")).toThrow(
        "task is already assigned"
      );
    });

    test("returns null for a missing task", () => {
      expect(service.assignTask("missing-id", "A")).toBeNull();
    });
  });

  describe("getStats", () => {
    test("counts statuses and only unfinished overdue tasks", () => {
      service.createTask({
        title: "Overdue todo",
        status: "todo",
        dueDate: "2020-01-01T00:00:00.000Z"
      });
      service.createTask({
        title: "Overdue done",
        status: "done",
        dueDate: "2020-01-01T00:00:00.000Z"
      });
      service.createTask({ title: "In progress", status: "in_progress" });

      expect(service.getStats()).toEqual({
        todo: 1,
        in_progress: 1,
        done: 1,
        overdue: 1
      });
    });
  });
});
