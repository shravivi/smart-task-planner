(() => {
  "use strict";

  const STORAGE_KEY = "daymark.tasks.v1";
  const $ = (selector) => document.querySelector(selector);

  const elements = {
    dateLabel: $("#dateLabel"),
    greeting: $("#greeting"),
    taskList: $("#taskList"),
    emptyState: $("#emptyState"),
    emptyTitle: $("#emptyTitle"),
    emptyMessage: $("#emptyMessage"),
    sectionTitle: $("#sectionTitle"),
    sectionDescription: $("#sectionDescription"),
    searchInput: $("#searchInput"),
    sortSelect: $("#sortSelect"),
    totalMetric: $("#totalMetric"),
    completedMetric: $("#completedMetric"),
    todayMetric: $("#todayMetric"),
    progressFill: $("#progressFill"),
    progressNote: $("#progressNote"),
    allCount: $("#allCount"),
    todayCount: $("#todayCount"),
    upcomingCount: $("#upcomingCount"),
    completedCount: $("#completedCount"),
    listSummary: $("#listSummary"),
    modalBackdrop: $("#modalBackdrop"),
    modalTitle: $("#modalTitle"),
    taskForm: $("#taskForm"),
    taskId: $("#taskId"),
    taskTitle: $("#taskTitle"),
    taskDescription: $("#taskDescription"),
    taskDueDate: $("#taskDueDate"),
    taskPriority: $("#taskPriority"),
    taskCategory: $("#taskCategory"),
    toast: $("#toast")
  };

  let tasks = loadTasks();
  let currentView = "all";
  let currentStatus = "all";
  let toastTimer;

  function localDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function loadTasks() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((task) =>
        task && typeof task.id === "string" &&
        typeof task.title === "string" &&
        typeof task.completed === "boolean"
      );
    } catch (error) {
      console.warn("Could not load saved tasks:", error);
      return [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      showToast("Could not save tasks in this browser.");
      console.error("Could not save tasks:", error);
    }
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
  }

  function formatDate(dateString) {
    if (!dateString) return "No due date";
    const parsed = new Date(`${dateString}T12:00:00`);
    if (Number.isNaN(parsed.getTime())) return "Invalid date";
    return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  function dateStatus(task) {
    if (!task.dueDate || task.completed) return "";
    const today = localDateString();
    if (task.dueDate < today) return "overdue";
    if (task.dueDate === today) return "today";
    return "";
  }

  function dueDateLabel(task) {
    if (!task.dueDate) return "No due date";
    const status = dateStatus(task);
    if (status === "overdue") return `Overdue · ${formatDate(task.dueDate)}`;
    if (status === "today") return "Due today";
    if (task.dueDate === localDateString(new Date(Date.now() + 86400000))) return "Due tomorrow";
    return formatDate(task.dueDate);
  }

  function updateGreeting() {
    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    elements.greeting.innerHTML = `${greeting}<span>.</span>`;
    elements.dateLabel.textContent = now.toLocaleDateString(undefined, {
      weekday: "long", month: "long", day: "numeric"
    }).toUpperCase();
  }

  function updateOverview() {
    const completed = tasks.filter((task) => task.completed).length;
    const today = localDateString();
    const dueToday = tasks.filter((task) => !task.completed && task.dueDate === today).length;
    const upcoming = tasks.filter((task) => !task.completed && task.dueDate && task.dueDate > today).length;
    const percentage = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

    elements.totalMetric.textContent = tasks.length;
    elements.completedMetric.textContent = completed;
    elements.todayMetric.textContent = dueToday;
    elements.progressFill.style.width = `${percentage}%`;
    elements.progressNote.textContent = `${percentage}% of all tasks`;
    elements.allCount.textContent = tasks.filter((task) => !task.completed).length;
    elements.todayCount.textContent = dueToday;
    elements.upcomingCount.textContent = upcoming;
    elements.completedCount.textContent = completed;
  }

  function viewDetails() {
    const details = {
      all: ["All tasks", "Everything you want to get done."],
      today: ["Today's tasks", "Your tasks with a deadline today."],
      upcoming: ["Upcoming tasks", "A look at what’s coming next."],
      completed: ["Completed tasks", "Look at how far you’ve come."]
    };
    const [title, description] = details[currentView];
    elements.sectionTitle.textContent = title;
    elements.sectionDescription.textContent = description;
    document.querySelectorAll(".nav-item").forEach((button) => {
      button.classList.toggle("active", button.dataset.filter === currentView);
    });
  }

  function matchesView(task) {
    const today = localDateString();
    if (currentView === "today") return !task.completed && task.dueDate === today;
    if (currentView === "upcoming") return !task.completed && Boolean(task.dueDate) && task.dueDate > today;
    if (currentView === "completed") return task.completed;
    return true;
  }

  function matchesStatus(task) {
    if (currentStatus === "active") return !task.completed;
    if (currentStatus === "completed") return task.completed;
    return true;
  }

  function sortTasks(list) {
    const priorityRank = { high: 0, medium: 1, low: 2 };
    const sortBy = elements.sortSelect.value;
    return list.sort((a, b) => {
      if (sortBy === "priority") {
        return (priorityRank[a.priority] ?? 1) - (priorityRank[b.priority] ?? 1) ||
          (a.dueDate || "9999-99-99").localeCompare(b.dueDate || "9999-99-99");
      }
      if (sortBy === "created") return (b.createdAt || 0) - (a.createdAt || 0);
      if (sortBy === "title") return a.title.localeCompare(b.title);
      return (a.dueDate || "9999-99-99").localeCompare(b.dueDate || "9999-99-99") ||
        (b.createdAt || 0) - (a.createdAt || 0);
    });
  }

  function renderTask(task) {
    const priority = ["high", "medium", "low"].includes(task.priority) ? task.priority : "medium";
    const category = task.category || "Personal";
    const status = dateStatus(task);
    return `
      <article class="task-row ${task.completed ? "completed" : ""}" data-task-id="${escapeHTML(task.id)}">
        <input class="check-task" type="checkbox" aria-label="Mark ${escapeHTML(task.title)} as ${task.completed ? "incomplete" : "completed"}" data-action="toggle" ${task.completed ? "checked" : ""}>
        <div class="task-main">
          <h3 class="task-title">${escapeHTML(task.title)}</h3>
          ${task.description ? `<p class="task-description">${escapeHTML(task.description)}</p>` : ""}
          <div class="task-meta">
            <span class="category-tag">${escapeHTML(category)}</span>
            <span class="priority-tag ${priority}">${priority.charAt(0).toUpperCase() + priority.slice(1)} priority</span>
          </div>
        </div>
        <div class="due-date ${status}">${escapeHTML(dueDateLabel(task))}</div>
        <div class="row-actions">
          <button class="icon-btn" data-action="edit" aria-label="Edit ${escapeHTML(task.title)}" title="Edit task">✎</button>
          <button class="icon-btn delete" data-action="delete" aria-label="Delete ${escapeHTML(task.title)}" title="Delete task">×</button>
        </div>
      </article>`;
  }

  function render() {
    updateGreeting();
    updateOverview();
    viewDetails();

    const query = elements.searchInput.value.trim().toLocaleLowerCase();
    let visibleTasks = tasks.filter((task) => matchesView(task) && matchesStatus(task));
    if (query) {
      visibleTasks = visibleTasks.filter((task) =>
        `${task.title} ${task.description || ""} ${task.category || ""} ${task.priority || ""}`
          .toLocaleLowerCase().includes(query)
      );
    }
    visibleTasks = sortTasks(visibleTasks);

    elements.taskList.innerHTML = visibleTasks.map(renderTask).join("");
    elements.emptyState.classList.toggle("visible", visibleTasks.length === 0);
    elements.taskList.style.display = visibleTasks.length ? "block" : "none";

    if (query) {
      elements.emptyTitle.textContent = "No matching tasks";
      elements.emptyMessage.textContent = "Try another search term or clear your search.";
      $("#emptyAddBtn").style.display = "none";
    } else if (currentView === "completed") {
      elements.emptyTitle.textContent = "Nothing completed yet";
      elements.emptyMessage.textContent = "Finished tasks will show up here.";
      $("#emptyAddBtn").style.display = "none";
    } else {
      elements.emptyTitle.textContent = "A clear space to start";
      elements.emptyMessage.textContent = "Add your first task and make a little progress today.";
      $("#emptyAddBtn").style.display = "inline-flex";
    }

    elements.listSummary.textContent = `${visibleTasks.length} ${visibleTasks.length === 1 ? "task" : "tasks"}`;
  }

  function openModal(task = null) {
    elements.taskForm.reset();
    elements.taskId.value = task ? task.id : "";
    elements.modalTitle.textContent = task ? "Edit task" : "Create a task";
    $("#saveTaskBtn").textContent = task ? "Save changes" : "Save task";
    elements.taskTitle.value = task ? task.title : "";
    elements.taskDescription.value = task ? task.description || "" : "";
    elements.taskDueDate.value = task ? task.dueDate || "" : "";
    elements.taskPriority.value = task ? task.priority || "medium" : "medium";
    elements.taskCategory.value = task ? task.category || "Personal" : "Personal";
    elements.modalBackdrop.hidden = false;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => elements.taskTitle.focus(), 30);
  }

  function closeModal() {
    elements.modalBackdrop.hidden = true;
    document.body.style.overflow = "";
  }

  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => elements.toast.classList.remove("show"), 2400);
  }

  function findTask(id) {
    return tasks.find((task) => task.id === id);
  }

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  $("#openAddBtn").addEventListener("click", () => openModal());
  $("#emptyAddBtn").addEventListener("click", () => openModal());
  $("#closeModalBtn").addEventListener("click", closeModal);
  $("#cancelBtn").addEventListener("click", closeModal);

  elements.modalBackdrop.addEventListener("click", (event) => {
    if (event.target === elements.modalBackdrop) closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !elements.modalBackdrop.hidden) closeModal();
  });

  elements.taskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = elements.taskTitle.value.trim();
    if (!title) {
      elements.taskTitle.focus();
      return;
    }

    const existingId = elements.taskId.value;
    const previous = existingId ? findTask(existingId) : null;
    const task = {
      id: existingId || createId(),
      title,
      description: elements.taskDescription.value.trim(),
      dueDate: elements.taskDueDate.value,
      priority: elements.taskPriority.value,
      category: elements.taskCategory.value,
      completed: previous ? previous.completed : false,
      createdAt: previous ? previous.createdAt : Date.now(),
      updatedAt: Date.now()
    };

    if (previous) {
      tasks = tasks.map((item) => item.id === existingId ? task : item);
      showToast("Task updated.");
    } else {
      tasks.unshift(task);
      showToast("Task added to your planner.");
    }

    saveTasks();
    closeModal();
    render();
  });

  elements.taskList.addEventListener("click", (event) => {
    const actionButton = event.target.closest("[data-action]");
    if (!actionButton) return;
    const row = actionButton.closest("[data-task-id]");
    if (!row) return;
    const task = findTask(row.dataset.taskId);
    if (!task) return;

    const action = actionButton.dataset.action;
    if (action === "edit") {
      openModal(task);
    } else if (action === "delete") {
      const confirmed = window.confirm(`Delete "${task.title}"? This cannot be undone.`);
      if (!confirmed) return;
      tasks = tasks.filter((item) => item.id !== task.id);
      saveTasks();
      render();
      showToast("Task deleted.");
    }
  });

  elements.taskList.addEventListener("change", (event) => {
    if (!event.target.matches('[data-action="toggle"]')) return;
    const row = event.target.closest("[data-task-id]");
    const task = findTask(row?.dataset.taskId);
    if (!task) return;
    task.completed = event.target.checked;
    task.updatedAt = Date.now();
    saveTasks();
    render();
    showToast(task.completed ? "Nice work — task completed!" : "Task marked in progress.");
  });

  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => {
      currentView = button.dataset.filter;
      currentStatus = "all";
      document.querySelectorAll(".chip").forEach((chip) => chip.classList.toggle("active", chip.dataset.status === "all"));
      render();
    });
  });

  document.querySelectorAll(".chip").forEach((button) => {
    button.addEventListener("click", () => {
      currentStatus = button.dataset.status;
      document.querySelectorAll(".chip").forEach((chip) => chip.classList.toggle("active", chip === button));
      render();
    });
  });

  elements.searchInput.addEventListener("input", render);
  elements.sortSelect.addEventListener("change", render);

  // Add a few starter tasks only on the first visit to make the interface easier to explore.
  if (!localStorage.getItem(STORAGE_KEY)) {
    const today = localDateString();
    tasks = [
      {
        id: createId(), title: "Plan the week ahead",
        description: "Choose the three most important things to focus on.",
        dueDate: today, priority: "high", category: "Personal",
        completed: false, createdAt: Date.now() - 3000
      },
      {
        id: createId(), title: "Review lecture notes",
        description: "Spend a little time revisiting this week's topics.",
        dueDate: "", priority: "medium", category: "Study",
        completed: false, createdAt: Date.now() - 2000
      },
      {
        id: createId(), title: "Take a proper break",
        description: "Step away from the screen and recharge.",
        dueDate: "", priority: "low", category: "Health",
        completed: true, createdAt: Date.now() - 1000
      }
    ];
    saveTasks();
  }

  render();
})();
