# Daymark — Smart Task Planner

Daymark is a responsive, browser-based task planner built with HTML, CSS, and vanilla JavaScript. It helps users organize tasks, set due dates, choose priorities, and track progress in a clean dashboard.

## Features

- Create, edit, and delete tasks
- Mark tasks as completed or in progress
- Set a due date, priority, notes, and category
- View all tasks, today's tasks, upcoming tasks, or completed tasks
- Search tasks by title, notes, category, or priority
- Sort tasks by due date, priority, creation time, or name
- Dashboard counters and completion progress
- Automatically save tasks in browser `localStorage`
- Responsive layout for desktop and mobile
- No external libraries, server, or build step required

## Technologies

- HTML5
- CSS3
- JavaScript (ES6+)
- Browser Local Storage

## Run locally

1. Download or clone this repository.
2. Open `index.html` in a modern browser.
3. Add and manage tasks.

For a local development server, you can use the Live Server extension in Visual Studio Code.

## How data is stored

Tasks are stored in the browser using `localStorage`. Data stays in the same browser profile on the same device and is not automatically synced to other devices. Clearing browser storage may remove saved tasks.

## Suggested test cases

| Test | Expected result |
|---|---|
| Add a task with a title | The task appears in the list |
| Submit an empty title | The browser prevents submission |
| Edit a task | Updated details appear in the list |
| Mark a task completed | The task is shown as completed and dashboard metrics update |
| Delete a task | The task is removed after confirmation |
| Search for a task | Matching tasks are shown |
| Change the sort option | Tasks are reordered |
| Refresh the page | Saved tasks remain in the same browser |
| Resize the browser | Layout adapts to the available screen width |

## Project structure

```text
smart-task-planner/
├── index.html
├── style.css
├── script.js
├── README.md
├── .gitignore
└── LICENSE
```

## Future improvements

- Export and import tasks as JSON
- Add recurring tasks
- Add calendar view
- Add optional reminders
- Add backend authentication and cross-device synchronization

## Academic use

Use this project as a learning base, customize it, test it, and document any changes you make. If submitting it for coursework, follow your institution's rules and be prepared to explain the implementation.
