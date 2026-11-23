
const express = require('express');
const router = express.Router();

// Initial category data
let categories = [
  {
    id: 1,
    name: 'School',
    description: 'Tasks related to education and assignments'
  },
  {
    id: 2,
    name: 'Personal',
    description: 'Personal activities and daily responsibilities'
  },
  {
    id: 3,
    name: 'Health',
    description: 'Exercise and health-related activities'
  }
];

// GET all categories and ADD a category
router.route('/')
  .get((req, res) => {
    res.json(categories);
  })
  .post((req, res) => {
    const { name, description } = req.body || {};

    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a category name and description',
        status: 400
      });
    }

    const newCategory = {
      id: categories.length
        ? Math.max(...categories.map(c => c.id)) + 1
        : 1,
      name,
      description
    };

    categories.push(newCategory);

    res.status(201).json(newCategory);
  });

// GET one category
router.get('/:id', (req, res, next) => {
  const category = categories.find(
    c => c.id === Number(req.params.id)
  );

  if (!category) {
    const error = new Error('Category not found');
    error.status = 404;
    return next(error);
  }

  res.json(category);
});

module.exports = router;
