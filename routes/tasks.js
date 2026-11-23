
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware');

// Initial task data
let tasks = [
  {
    id: 1,
    title: 'Complete assignment',
    description: 'Finish programming homework',
    priority: 'High',
    category: 'School',
    done: false
  },
  {
    id: 2,
    title: 'Buy groceries',
    description: 'Buy food for the week',
    priority: 'Medium',
    category: 'Personal',
    done: false
  },
  {
    id: 3,
    title: 'Study JavaScript',
    description: 'Practice arrays and functions',
    priority: 'High',
    category: 'School',
    done: true
  },
  {
    id: 4,
    title: 'Clean my room',
    description: 'Organize the bedroom',
    priority: 'Low',
    category: 'Personal',
    done: false
  },
  {
    id: 5,
    title: 'Exercise',
    description: 'Do 20 pushups',
    priority: 'Medium',
    category: 'Health',
    done: false
  }
];

// GET all tasks and ADD a new task
router.route('/')
  .get((req, res) => {
    res.json(tasks);
  })

  .post((req, res) => {
    const { title, description, priority, category, done } = req.body || {};

    if (!title || !description || !priority || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
        status: 400
      });
    }

    const newTask = {
      id: tasks.length
        ? Math.max(...tasks.map(t => t.id)) + 1
        : 1,
      title,
      description,
      priority,
      category,
      done: done ?? false
    };

    tasks.push(newTask);

    res.status(201).json(newTask);
  });


// Search tasks by title
router.get('/search', (req, res) => {
  const searchTerm = req.query.title;

  if (!searchTerm || !searchTerm.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a title to search for',
      status: 400
    });
  }

  const results = tasks.filter(task =>
    task.title.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  res.json({
    success: true,
    count: results.length,
    data: results
  });
});

// GET tasks by category
router.get('/category{/:name}', (req, res) => {
  const { name } = req.params;

  if (!name) {
    return res.json(tasks);
  }

  const filtered = tasks.filter(
    task => task.category.toLowerCase() === name.toLowerCase()
  );

  res.json(filtered);
});

// GET, UPDATE and DELETE a specific task
router.route('/:id')

  // GET one task
  .get(async (req, res) => {
    const task = tasks.find(t => t.id === Number(req.params.id));

    if (!task) {
      const error = new Error('Task not found');
      error.status = 404;
      throw error;
    }

    res.json(task);
  })

  // UPDATE a task
  .put((req, res, next) => {
    const task = tasks.find(t => t.id === Number(req.params.id));

    if (!task) {
      const error = new Error('Task not found');
      error.status = 404;
      return next(error);
    }

    Object.assign(task, req.body, { id: task.id });

    res.json(task);
  })

  // DELETE a task (protected)
  .delete(requireAuth, (req, res, next) => {
    const index = tasks.findIndex(
      t => t.id === Number(req.params.id)
    );

    if (index === -1) {
      const error = new Error('Task not found');
      error.status = 404;
      return next(error);
    }

    const deletedTask = tasks.splice(index, 1);

    res.json({
      message: 'Task deleted successfully',
      task: deletedTask[0]
    });
  });

module.exports = router;
