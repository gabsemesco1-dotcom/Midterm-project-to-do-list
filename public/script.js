const API_BASE = '';
const DELETE_TOKEN = 'todo-secret-123';
const state = {
  tasks: [],
  categories: [],
  visibleTasks: [],
  activeCategory: '',
  activeStatus: 'all',
  search: '',
  loading: false,
  error: ''
};

const taskList = document.getElementById('task-list');
const categoryNav = document.getElementById('category-nav');
const taskModal = document.getElementById('task-modal');
const categoryModal = document.getElementById('category-modal');
let searchTimer;

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    }
  });
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error(`The server returned an unreadable response (${response.status}).`);
  }
  if (!response.ok) {
    throw new Error(result.message || `Request failed (${response.status}).`);
  }
  return result;
}

function showToast(message, isError = false) {
  const toast = document.createElement('div');
  toast.className = `toast${isError ? ' error' : ''}`;
  toast.textContent = message;
  document.getElementById('toast-region').append(toast);
  window.setTimeout(() => toast.remove(), 3500);
}

function setLoading() {
  state.loading = true;
  state.error = '';
  renderTasks();
}

function refreshStats() {
  const completed = state.tasks.filter(task => task.done).length;
  const pending = state.tasks.length - completed;
  const progress = state.tasks.length ? Math.round(completed / state.tasks.length * 100) : 0;
  document.getElementById('total-stat').textContent = state.tasks.length;
  document.getElementById('pending-stat').textContent = pending;
  document.getElementById('completed-stat').textContent = completed;
  document.getElementById('progress-number').textContent = `${progress}%`;
  document.getElementById('progress-bar').style.width = `${progress}%`;
  document.getElementById('completion-copy').textContent = completed ? 'Look at you go' : 'Your first win is waiting';
  document.getElementById('all-count').textContent = state.tasks.length;
  document.getElementById('pending-count').textContent = pending;
}

function updateViewLabels() {
  const label = state.activeCategory || (
    state.activeStatus === 'pending' ? 'In progress' :
      state.activeStatus === 'completed' ? 'Completed' : 'All tasks'
  );
  document.getElementById('view-label').textContent = label;
  document.getElementById('tasks-heading').innerHTML = `${escapeHtml(state.activeCategory || (state.activeStatus === 'all' ? 'Today’s focus' : label))}<span class="heading-dot">.</span>`;
  document.querySelectorAll('.nav-link').forEach(button => {
    button.classList.toggle('active', !state.activeCategory && button.dataset.status === state.activeStatus);
  });
}

function renderCategories() {
  const counts = state.tasks.reduce((result, task) => {
    result[task.category] = (result[task.category] || 0) + 1;
    return result;
  }, {});
  categoryNav.innerHTML = state.categories.map(category => `
    <button class="category-link${state.activeCategory === category.name ? ' active' : ''}" type="button" data-category="${escapeHtml(category.name)}">
      <span class="category-mark"></span><span>${escapeHtml(category.name)}</span><span class="category-size">${counts[category.name] || 0}</span>
    </button>`).join('');
  const categorySelect = document.getElementById('task-category');
  const selected = categorySelect.value;
  categorySelect.innerHTML = state.categories.map(category =>
    `<option value="${escapeHtml(category.name)}">${escapeHtml(category.name)}</option>`
  ).join('');
  if (state.categories.some(category => category.name === selected)) categorySelect.value = selected;
}

function renderFilters() {
  const filters = [];
  if (state.activeCategory) filters.push(['category', state.activeCategory]);
  if (state.search) filters.push(['search', `“${state.search}”`]);
  const container = document.getElementById('active-filters');
  container.hidden = filters.length === 0;
  container.innerHTML = filters.map(([type, value]) => `
    <span class="filter-chip">${escapeHtml(value)} <button type="button" data-clear-filter="${type}" aria-label="Clear ${type} filter">×</button></span>
  `).join('');
}

function taskMarkup(task, index) {
  const priority = String(task.priority || 'Medium').toLowerCase();
  const done = Boolean(task.done);
  return `
    <article class="task-card${done ? ' completed' : ''}" style="animation-delay:${Math.min(index, 8) * 35}ms" data-task-id="${escapeHtml(task.id)}">
      <button class="task-check${done ? ' is-done' : ''}" type="button" data-action="toggle" aria-label="${done ? 'Mark pending' : 'Mark completed'}">
        ${done ? '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3 8 3.2 3.2L13 4.5"></path></svg>' : ''}
      </button>
      <div class="task-main">
        <div class="task-title-row"><h3 class="task-title">${escapeHtml(task.title)}</h3></div>
        ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
        <div class="task-meta">
          <span class="task-tag priority-tag priority-${escapeHtml(priority)}">${escapeHtml(task.priority || 'Medium')} priority</span>
          <span class="task-tag">${escapeHtml(task.category || 'Uncategorized')}</span>
        </div>
      </div>
      <div class="task-actions">
        <button class="task-action" type="button" data-action="edit" aria-label="Edit task" title="Edit">↗</button>
        <button class="task-action delete" type="button" data-action="delete" aria-label="Delete task" title="Delete">⌫</button>
      </div>
    </article>`;
}

function renderTasks() {
  refreshStats();
  updateViewLabels();
  renderFilters();

  if (state.loading) {
    taskList.innerHTML = '<div class="loading-state"><span class="spinner"></span>Gathering your tasks...</div>';
    return;
  }
  if (state.error) {
    taskList.innerHTML = `<div class="error-state"><div class="empty-illustration">!</div><h3>We couldn’t load your tasks</h3><p>${escapeHtml(state.error)}</p><button class="button-primary" type="button" data-action="retry">Try again</button></div>`;
    return;
  }
  if (!state.visibleTasks.length) {
    const hasFilters = state.search || state.activeCategory || state.activeStatus !== 'all';
    const title = hasFilters ? 'Nothing here just yet' : 'A little room to begin';
    const copy = hasFilters ? 'Try another search or clear a filter to see more tasks.' : 'Add a task to turn your good intentions into a plan.';
    taskList.innerHTML = `<div class="empty-state"><div class="empty-illustration">${hasFilters ? '⌕' : '✳'}</div><h3>${title}</h3><p>${copy}</p>${hasFilters ? '' : '<button class="new-task-button" type="button" data-action="new">+ Add your first task</button>'}</div>`;
    return;
  }
  taskList.innerHTML = state.visibleTasks.map(taskMarkup).join('');
}

function getVisibleTasks() {
  const search = state.search.trim();
  const requests = [];
  if (search) {
    requests.push(request(`/tasks/search?title=${encodeURIComponent(search)}`).then(result => result.data));
  } else {
    requests.push(Promise.resolve(null));
  }
  if (state.activeCategory) {
    requests.push(request(`/tasks/category/${encodeURIComponent(state.activeCategory)}`));
  } else {
    requests.push(Promise.resolve(null));
  }
  return Promise.all(requests).then(([searchResults, categoryResults]) => {
    let tasks = searchResults || categoryResults || state.tasks;
    if (searchResults && categoryResults) {
      const categoryIds = new Set(categoryResults.map(task => task.id));
      tasks = searchResults.filter(task => categoryIds.has(task.id));
    }
    if (state.activeStatus === 'pending') tasks = tasks.filter(task => !task.done);
    if (state.activeStatus === 'completed') tasks = tasks.filter(task => task.done);
    return tasks;
  });
}

async function loadVisibleTasks() {
  setLoading();
  try {
    state.visibleTasks = await getVisibleTasks();
  } catch (error) {
    state.error = error.message;
  } finally {
    state.loading = false;
    renderTasks();
  }
}

async function loadDashboard() {
  setLoading();
  try {
    const [tasks, categories] = await Promise.all([
      request('/tasks'),
      request('/categories')
    ]);
    state.tasks = tasks;
    state.categories = categories;
    renderCategories();
    state.visibleTasks = await getVisibleTasks();
  } catch (error) {
    state.error = error.message;
  } finally {
    state.loading = false;
    renderCategories();
    renderTasks();
  }
}

function openTaskModal(task = null) {
  const form = document.getElementById('task-form');
  form.reset();
  document.getElementById('task-id').value = task ? task.id : '';
  document.getElementById('task-modal-kicker').textContent = task ? 'TWEAK YOUR PLAN' : 'MAKE IT HAPPEN';
  document.getElementById('task-modal-title').innerHTML = task ? 'Edit your task<span class="heading-dot">.</span>' : 'A new task<span class="heading-dot">.</span>';
  document.getElementById('save-task').innerHTML = task ? 'Save changes <span>↗</span>' : 'Create task <span>↗</span>';
  renderCategories();
  if (task) {
    form.elements.title.value = task.title;
    form.elements.description.value = task.description;
    form.elements.priority.value = task.priority;
    form.elements.category.value = task.category;
    form.elements.done.checked = Boolean(task.done);
  } else if (state.activeCategory) {
    form.elements.category.value = state.activeCategory;
  }
  taskModal.showModal();
  document.getElementById('task-title').focus();
}

function closeModal(id) {
  document.getElementById(id).close();
}

async function submitTask(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const id = form.elements.taskId.value;
  const data = {
    title: form.elements.title.value.trim(),
    description: form.elements.description.value.trim(),
    priority: form.elements.priority.value,
    category: form.elements.category.value,
    done: form.elements.done.checked
  };
  const button = document.getElementById('save-task');
  button.disabled = true;
  try {
    await request(id ? `/tasks/${encodeURIComponent(id)}` : '/tasks', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(data)
    });
    closeModal('task-modal');
    showToast(id ? 'Task updated. Nice and tidy.' : 'Your new task is on the list.');
    await loadDashboard();
  } catch (error) {
    showToast(error.message, true);
  } finally {
    button.disabled = false;
  }
}

async function submitCategory(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = document.getElementById('save-category');
  button.disabled = true;
  try {
    const category = await request('/categories', {
      method: 'POST',
      body: JSON.stringify({
        name: form.elements.name.value.trim(),
        description: form.elements.description.value.trim()
      })
    });
    closeModal('category-modal');
    form.reset();
    state.activeCategory = '';
    await loadDashboard();
    showToast(`${category.name} category created.`);
  } catch (error) {
    showToast(error.message, true);
  } finally {
    button.disabled = false;
  }
}

async function toggleTask(task) {
  try {
    await request(`/tasks/${encodeURIComponent(task.id)}`, {
      method: 'PUT',
      body: JSON.stringify({ ...task, done: !task.done })
    });
    await loadDashboard();
  } catch (error) {
    showToast(error.message, true);
  }
}

async function deleteTask(task) {
  if (!window.confirm(`Delete “${task.title}”? This can’t be undone.`)) return;
  try {
    await request(`/tasks/${encodeURIComponent(task.id)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${DELETE_TOKEN}` }
    });
    showToast('Task deleted.');
    await loadDashboard();
  } catch (error) {
    showToast(error.message, true);
  }
}

function setStatus(status) {
  state.activeStatus = status;
  state.activeCategory = '';
  loadVisibleTasks();
}

document.getElementById('today-label').textContent = new Intl.DateTimeFormat(undefined, {
  weekday: 'long', month: 'long', day: 'numeric'
}).format(new Date()).toUpperCase();
document.getElementById('task-form').addEventListener('submit', submitTask);
document.getElementById('category-form').addEventListener('submit', submitCategory);
document.getElementById('new-task-top').addEventListener('click', () => openTaskModal());
document.getElementById('new-task-main').addEventListener('click', () => openTaskModal());
document.querySelector('.add-category-trigger').addEventListener('click', () => categoryModal.showModal());
document.querySelectorAll('[data-close]').forEach(button => {
  button.addEventListener('click', () => closeModal(button.dataset.close));
});
document.querySelectorAll('.nav-link').forEach(button => {
  button.addEventListener('click', () => setStatus(button.dataset.status));
});
document.getElementById('task-search').addEventListener('input', event => {
  state.search = event.target.value;
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(loadVisibleTasks, 250);
});
document.addEventListener('keydown', event => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    document.getElementById('task-search').focus();
  }
});
categoryNav.addEventListener('click', event => {
  const button = event.target.closest('[data-category]');
  if (!button) return;
  state.activeCategory = state.activeCategory === button.dataset.category ? '' : button.dataset.category;
  state.activeStatus = 'all';
  renderCategories();
  loadVisibleTasks();
});
document.getElementById('active-filters').addEventListener('click', event => {
  const type = event.target.dataset.clearFilter;
  if (!type) return;
  if (type === 'category') state.activeCategory = '';
  if (type === 'search') {
    state.search = '';
    document.getElementById('task-search').value = '';
  }
  renderCategories();
  loadVisibleTasks();
});
taskList.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  if (action === 'new') {
    openTaskModal();
    return;
  }
  if (action === 'retry') {
    loadDashboard();
    return;
  }
  const card = button.closest('[data-task-id]');
  const task = state.tasks.find(item => String(item.id) === card?.dataset.taskId);
  if (!task) return;
  if (action === 'toggle') toggleTask(task);
  if (action === 'edit') openTaskModal(task);
  if (action === 'delete') deleteTask(task);
});
document.getElementById('menu-toggle').addEventListener('click', () => {
  document.body.classList.toggle('sidebar-open');
  document.getElementById('sidebar-scrim').classList.toggle('visible');
});
document.getElementById('sidebar-scrim').addEventListener('click', () => {
  document.body.classList.remove('sidebar-open');
  document.getElementById('sidebar-scrim').classList.remove('visible');
});
categoryNav.addEventListener('click', event => {
  if (event.target.closest('[data-category]')) {
    document.body.classList.remove('sidebar-open');
    document.getElementById('sidebar-scrim').classList.remove('visible');
  }
});
document.querySelectorAll('.nav-link').forEach(button => {
  button.addEventListener('click', () => {
    document.body.classList.remove('sidebar-open');
    document.getElementById('sidebar-scrim').classList.remove('visible');
  });
});

loadDashboard();
