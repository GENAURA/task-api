const { randomUUID } = require("crypto");

const tasks = new Map();

const STATUSES = ["todo", "in_progress", "done"];
const PRIORITIES = ["low", "medium", "high"];

function resetStore() {
  tasks.clear();
}

function listTasks({ status, page, limit } = {}) {
  let result = Array.from(tasks.values());

  if (status !== undefined) {
    if (!STATUSES.includes(status)) {
      const error = new Error(`Invalid status: ${status}`);
      error.statusCode = 400;
      throw error;
    }
    result = result.filter((task) => task.status === status);
  }

  if (page !== undefined || limit !== undefined) {
    const safePage = Number(page ?? 1);
    const safeLimit = Number(limit ?? 10);

    if (
      !Number.isInteger(safePage) ||
      safePage < 1 ||
      !Number.isInteger(safeLimit) ||
      safeLimit < 1 ||
      safeLimit > 100
    ) {
      const error = new Error("page must be >= 1 and limit must be between 1 and 100");
      error.statusCode = 400;
      throw error;
    }

    const start = (safePage - 1) * safeLimit;
    result = result.slice(start, start + safeLimit);
  }

  return result;
}

function validateTaskInput(input, { partial = false } = {}) {
  if (!partial || input.title !== undefined) {
    if (typeof input.title !== "string" || !input.title.trim()) {
      return "title is required and must be a non-empty string";
    }
  }

  if (input.description !== undefined && typeof input.description !== "string") {
    return "description must be a string";
  }

  if (input.status !== undefined && !STATUSES.includes(input.status)) {
    return `status must be one of: ${STATUSES.join(", ")}`;
  }

  if (input.priority !== undefined && !PRIORITIES.includes(input.priority)) {
    return `priority must be one of: ${PRIORITIES.join(", ")}`;
  }

  if (input.dueDate !== undefined && input.dueDate !== null) {
    if (typeof input.dueDate !== "string" || Number.isNaN(Date.parse(input.dueDate))) {
      return "dueDate must be a valid ISO date string or null";
    }
  }

  return null;
}

function createTask(input = {}) {
  const validationError = validateTaskInput(input);
  if (validationError) {
    const error = new Error(validationError);
    error.statusCode = 400;
    throw error;
  }

  const now = new Date().toISOString();
  const task = {
    id: randomUUID(),
    title: input.title.trim(),
    description: input.description ?? "",
    status: input.status ?? "todo",
    priority: input.priority ?? "medium",
    dueDate: input.dueDate ?? null,
    completedAt: input.status === "done" ? now : null,
    createdAt: now
  };

  tasks.set(task.id, task);
  return task;
}

function getTask(id) {
  return tasks.get(id) ?? null;
}

function updateTask(id, input = {}) {
  const task = getTask(id);
  if (!task) return null;

  const validationError = validateTaskInput(input, { partial: true });
  if (validationError) {
    const error = new Error(validationError);
    error.statusCode = 400;
    throw error;
  }

  if (input.title !== undefined) task.title = input.title.trim();
  if (input.description !== undefined) task.description = input.description;
  if (input.priority !== undefined) task.priority = input.priority;
  if (input.dueDate !== undefined) task.dueDate = input.dueDate;

  if (input.status !== undefined) {
    task.status = input.status;
    task.completedAt =
      input.status === "done" ? (task.completedAt ?? new Date().toISOString()) : null;
  }

  return task;
}

function deleteTask(id) {
  return tasks.delete(id);
}

function completeTask(id) {
  const task = getTask(id);
  if (!task) return null;

  if (task.status !== "done") {
    task.status = "done";
    task.completedAt = new Date().toISOString();
  }

  return task;
}

function assignTask(id, assignee) {
  const task = getTask(id);
  if (!task) return null;

  if (typeof assignee !== "string" || !assignee.trim()) {
    const error = new Error("assignee must be a non-empty string");
    error.statusCode = 400;
    throw error;
  }

  if (task.assignee) {
    const error = new Error("task is already assigned");
    error.statusCode = 409;
    throw error;
  }

  task.assignee = assignee.trim();
  return task;
}

function getStats() {
  const all = Array.from(tasks.values());

  const counts = {
    todo: 0,
    in_progress: 0,
    done: 0
  };

  let overdue = 0;
  const now = Date.now();

  for (const task of all) {
    counts[task.status] += 1;

    // Bug fixed during the assignment:
    // completed tasks must not be counted as overdue.
    if (task.status !== "done" && task.dueDate && Date.parse(task.dueDate) < now) {
      overdue += 1;
    }
  }

  return { ...counts, overdue };
}

module.exports = {
  STATUSES,
  PRIORITIES,
  resetStore,
  listTasks,
  createTask,
  getTask,
  updateTask,
  deleteTask,
  completeTask,
  assignTask,
  getStats
};
