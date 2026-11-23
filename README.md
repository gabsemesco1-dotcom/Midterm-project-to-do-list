# Midterm Project – To-do List API

## Student Information

- **Name:** Gabriel Chukwuemeka Victor
- **NIM:** 20250040222
- **Project Theme:** To-do List Management System

## Project Description

This project is a RESTful API built using Node.js and Express 5. It allows users to manage daily tasks by creating, viewing, updating, deleting, filtering, and searching tasks.

The application stores data in JavaScript arrays without using a database. It also includes a second resource for managing categories and a simple frontend dashboard.

## Technologies Used

- Node.js
- Express 5
- Nodemon
- HTML
- CSS
- JavaScript

## Project Structure

```text
Todo-List/
├── index.js
├── middleware.js
├── package.json
├── package-lock.json
├── README.md
├── routes/
│   ├── tasks.js
│   └── categories.js
├── public/
│   ├── index.html
│   ├── style.css
│   └── script.js
└── screenshots/
```

## Installation and Setup

1. Make sure Node.js is installed.
2. Open the project folder in your terminal.
3. Install the dependencies:

```bash
npm install
```

4. Start the development server:

```bash
npm run dev
```

5. The API will run at:

```text
http://localhost:3000
```

6. Open the frontend dashboard at:

```text
http://localhost:3000/app
```

## API Endpoints

### Tasks

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Welcome message |
| GET | `/tasks` | Get all tasks |
| GET | `/tasks/:id` | Get a task by ID |
| POST | `/tasks` | Create a new task |
| PUT | `/tasks/:id` | Update a task |
| DELETE | `/tasks/:id` | Delete a task (authentication required) |
| GET | `/tasks/category` | Get all tasks when no category is specified |
| GET | `/tasks/category/:name` | Filter tasks by category |
| GET | `/tasks/search?title=javascript` | Search tasks by title |

### Categories

| Method | Endpoint | Description |
|---|---|---|
| GET | `/categories` | Get all categories |
| POST | `/categories` | Create a category |
| GET | `/categories/:id` | Get a category by ID |

### Additional Route

| Method | Endpoint | Description |
|---|---|---|
| GET | `/files/*path` | Test Express 5 wildcard path matching |

## Task Data Fields

Each task contains:

- `id` – Unique task identifier
- `title` – Task title
- `description` – Task description
- `priority` – Task priority
- `category` – Task category
- `done` – Completion status

## Authentication

The DELETE task endpoint requires a Bearer token.

In Postman, select **Authorization → Bearer Token** and enter:

```text
todo-secret-123
```

## Error Handling and Middleware

The project includes:

- Request logging middleware.
- Authentication middleware for protected deletion.
- Validation errors with HTTP 400.
- Resource not found errors with HTTP 404.
- Unknown route handling.
- Centralized error-handling middleware.

## Bonus Features

1. **Second Resource:** Category management using a separate modular router.
2. **Search:** Search tasks by title using a query string.
3. **Consistent Error Format:** Custom JSON error responses.
4. **Frontend Dashboard:** A simple interface for managing tasks.

## Testing

All API endpoints were tested using Postman. Screenshots of the requests and responses are available in the `screenshots` folder.

## Author

**Gabriel Chukwuemeka Victor**  
**NIM: 20250040222**