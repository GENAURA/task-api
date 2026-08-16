const express = require("express");
const taskService = require("./taskService");

const app = express();
app.use(express.json());

function handleError(res, error) {
  const status = error.statusCode || 500;
  return res.status(status).json({ error: error.message });
}

app.get("/tasks", (req, res) => {
  try {
    const tasks = taskService.listTasks({
      status: req.query.status,
      page: req.query.page,
      limit: req.query.limit
    });
    res.json(tasks);
  } catch (error) {
    handleError(res, error);
  }
});

app.get("/tasks/stats", (req, res) => {
  try {
    res.json(taskService.getStats());
  } catch (error) {
    handleError(res, error);
  }
});

app.post("/tasks", (req, res) => {
  try {
    const task = taskService.createTask(req.body);
    res.status(201).json(task);
  } catch (error) {
    handleError(res, error);
  }
});

app.put("/tasks/:id", (req, res) => {
  try {
    const task = taskService.updateTask(req.params.id, req.body);
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  } catch (error) {
    handleError(res, error);
  }
});

app.delete("/tasks/:id", (req, res) => {
  try {
    const deleted = taskService.deleteTask(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Task not found" });
    res.status(204).send();
  } catch (error) {
    handleError(res, error);
  }
});

app.patch("/tasks/:id/complete", (req, res) => {
  try {
    const task = taskService.completeTask(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  } catch (error) {
    handleError(res, error);
  }
});

app.patch("/tasks/:id/assign", (req, res) => {
  try {
    const task = taskService.assignTask(req.params.id, req.body?.assignee);
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  } catch (error) {
    handleError(res, error);
  }
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

module.exports = app;
