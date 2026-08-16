const express = require("express");
const taskService = require("./taskService");

const app = express();

// Middleware
app.use(express.json());

// ============================================================
// Root / Health Check
// ============================================================

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Task Manager API is running",
    status: "ok",
    endpoints: {
      tasks: "/tasks",
      stats: "/tasks/stats",
      assign: "PATCH /tasks/:id/assign",
      complete: "PATCH /tasks/:id/complete"
    }
  });
});

// ============================================================
// Error Handler
// ============================================================

function handleError(res, error) {
  const status = error.statusCode || 500;

  return res.status(status).json({
    error: error.message
  });
}

// ============================================================
// GET /tasks
// List all tasks
// Filter by status
// Pagination
// ============================================================

app.get("/tasks", (req, res) => {
  try {
    const tasks = taskService.listTasks({
      status: req.query.status,
      page: req.query.page,
      limit: req.query.limit
    });

    res.status(200).json(tasks);
  } catch (error) {
    handleError(res, error);
  }
});

// ============================================================
// GET /tasks/stats
// Get task statistics
// ============================================================

app.get("/tasks/stats", (req, res) => {
  try {
    const stats = taskService.getStats();

    res.status(200).json(stats);
  } catch (error) {
    handleError(res, error);
  }
});

// ============================================================
// POST /tasks
// Create a new task
// ============================================================

app.post("/tasks", (req, res) => {
  try {
    const task = taskService.createTask(req.body);

    res.status(201).json(task);
  } catch (error) {
    handleError(res, error);
  }
});

// ============================================================
// PUT /tasks/:id
// Update an existing task
// ============================================================

app.put("/tasks/:id", (req, res) => {
  try {
    const task = taskService.updateTask(
      req.params.id,
      req.body
    );

    if (!task) {
      return res.status(404).json({
        error: "Task not found"
      });
    }

    res.status(200).json(task);
  } catch (error) {
    handleError(res, error);
  }
});

// ============================================================
// DELETE /tasks/:id
// Delete a task
// ============================================================

app.delete("/tasks/:id", (req, res) => {
  try {
    const deleted = taskService.deleteTask(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        error: "Task not found"
      });
    }

    res.status(204).send();
  } catch (error) {
    handleError(res, error);
  }
});

// ============================================================
// PATCH /tasks/:id/complete
// Mark task as completed
// ============================================================

app.patch("/tasks/:id/complete", (req, res) => {
  try {
    const task = taskService.completeTask(req.params.id);

    if (!task) {
      return res.status(404).json({
        error: "Task not found"
      });
    }

    res.status(200).json(task);
  } catch (error) {
    handleError(res, error);
  }
});

// ============================================================
// PATCH /tasks/:id/assign
// Assign task to a user
// ============================================================

app.patch("/tasks/:id/assign", (req, res) => {
  try {
    const task = taskService.assignTask(
      req.params.id,
      req.body?.assignee
    );

    if (!task) {
      return res.status(404).json({
        error: "Task not found"
      });
    }

    res.status(200).json(task);
  } catch (error) {
    handleError(res, error);
  }
});

// ============================================================
// Unknown Route
// ============================================================

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found"
  });
});

// ============================================================
// Export App
// ============================================================

module.exports = app;