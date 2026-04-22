// ===========================
// API Configuration
// ===========================
const API_URL = '/api/tasks';

// ===========================
// State
// ===========================
let currentFilter = 'all';
let editingTaskId = null;
let calendarYear = new Date().getFullYear();
let calendarMonth = new Date().getMonth(); // 0-indexed
let selectedDate = null; // 'YYYY-MM-DD' string
let monthTasksCache = []; // tasks for current calendar month

// ===========================
// DOM Elements
// ===========================
const taskList = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');
const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const taskForm = document.getElementById('task-form');
const taskIdInput = document.getElementById('task-id');
const taskTitleInput = document.getElementById('task-title');
const taskDateInput = document.getElementById('task-date');
const taskTimeInput = document.getElementById('task-time');
const taskMonthDisplay = document.getElementById('task-month-display');
const btnSubmit = document.getElementById('btn-submit');

const statTotal = document.getElementById('stat-total');
const statCompleted = document.getElementById('stat-completed');
const statPending = document.getElementById('stat-pending');

const filterBtns = document.querySelectorAll('.filter-btn');

// Calendar elements
const calGrid = document.getElementById('cal-grid');
const calMonthTitle = document.getElementById('cal-month-title');
const calPrev = document.getElementById('cal-prev');
const calNext = document.getElementById('cal-next');
const dayTasksPlaceholder = document.getElementById('day-tasks-placeholder');
const dayTasksContent = document.getElementById('day-tasks-content');
const dayTasksTitle = document.getElementById('day-tasks-title');
const dayTasksCount = document.getElementById('day-tasks-count');
const dayTasksList = document.getElementById('day-tasks-list');
const dayTasksEmpty = document.getElementById('day-tasks-empty');

// Task detail modal
const taskDetailOverlay = document.getElementById('task-detail-overlay');

// ===========================
// Initialize
// ===========================
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    setupEventListeners();
    setDefaultDate();
    renderCalendar();
});

function setupEventListeners() {
    // Filter buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            loadTasks();
        });
    });

    // Auto-fill month from date
    taskDateInput.addEventListener('change', () => {
        updateMonthDisplay();
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            closeTaskDetail();
        }
    });

    // Calendar navigation
    calPrev.addEventListener('click', () => {
        calendarMonth--;
        if (calendarMonth < 0) {
            calendarMonth = 11;
            calendarYear--;
        }
        renderCalendar();
    });

    calNext.addEventListener('click', () => {
        calendarMonth++;
        if (calendarMonth > 11) {
            calendarMonth = 0;
            calendarYear++;
        }
        renderCalendar();
    });
}

function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    taskDateInput.value = today;
    updateMonthDisplay();
}

function updateMonthDisplay() {
    const dateVal = taskDateInput.value;
    if (dateVal) {
        const date = new Date(dateVal + 'T00:00:00');
        const month = date.toLocaleString('en-US', { month: 'long' });
        taskMonthDisplay.value = month;
    } else {
        taskMonthDisplay.value = '';
    }
}

// ===========================
// API Calls
// ===========================
async function fetchTasks(filter) {
    let url = API_URL;
    if (filter === 'completed') url += '?status=completed';
    else if (filter === 'pending') url += '?status=pending';

    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch tasks');
    return await response.json();
}

async function fetchTasksByDate(dateStr) {
    const response = await fetch(`${API_URL}/date/${dateStr}`);
    if (!response.ok) throw new Error('Failed to fetch tasks for date');
    return await response.json();
}

async function fetchTasksByRange(startStr, endStr) {
    const response = await fetch(`${API_URL}/range?start=${startStr}&end=${endStr}`);
    if (!response.ok) throw new Error('Failed to fetch tasks for range');
    return await response.json();
}

async function createTask(taskData) {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
    });
    if (!response.ok) throw new Error('Failed to create task');
    return await response.json();
}

async function updateTask(id, taskData) {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
    });
    if (!response.ok) throw new Error('Failed to update task');
    return await response.json();
}

async function toggleTaskStatus(id) {
    const response = await fetch(`${API_URL}/${id}/toggle`, {
        method: 'PATCH'
    });
    if (!response.ok) throw new Error('Failed to toggle task');
    return await response.json();
}

async function deleteTask(id) {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete task');
}

// ===========================
// Load & Render Tasks
// ===========================
async function loadTasks() {
    try {
        const tasks = await fetchTasks(currentFilter);
        renderTasks(tasks);
        await updateStats();
    } catch (error) {
        console.error('Error loading tasks:', error);
        showToast('Failed to load tasks', 'error');
    }
}

function renderTasks(tasks) {
    if (tasks.length === 0) {
        taskList.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    taskList.style.display = 'flex';

    taskList.innerHTML = tasks.map((task, index) => `
        <div class="task-card ${task.completed ? 'completed' : ''}" 
             style="animation-delay: ${index * 0.05}s"
             id="task-card-${task.id}">
            
            <div class="task-checkbox" 
                 onclick="handleToggle(${task.id})" 
                 title="${task.completed ? 'Mark as pending' : 'Mark as completed'}">
                ${task.completed ? '✓' : ''}
            </div>
            
            <div class="task-info">
                <div class="task-title">${escapeHtml(task.title)}</div>
                <div class="task-meta">
                    <span class="task-meta-item">
                        <span class="task-meta-icon">📅</span>
                        ${formatDate(task.taskDate)}
                    </span>
                    ${task.taskTime ? `
                        <span class="task-meta-item">
                            <span class="task-meta-icon">🕐</span>
                            ${formatTime(task.taskTime)}
                        </span>
                    ` : ''}
                    <span class="task-meta-item">
                        <span class="task-meta-icon">📆</span>
                        ${task.month || '—'}
                    </span>
                </div>
            </div>
            
            <span class="badge ${task.completed ? 'badge-completed' : 'badge-pending'}">
                ${task.completed ? 'Completed' : 'Pending'}
            </span>
            
            <div class="task-actions">
                <button class="action-btn" onclick="openEditModal(${task.id})" title="Edit task">✏️</button>
                <button class="action-btn delete" onclick="handleDelete(${task.id})" title="Delete task">🗑️</button>
            </div>
        </div>
    `).join('');
}

async function updateStats() {
    try {
        const allTasks = await fetchTasks('all');
        const completedCount = allTasks.filter(t => t.completed).length;
        const pendingCount = allTasks.length - completedCount;

        animateNumber(statTotal, allTasks.length);
        animateNumber(statCompleted, completedCount);
        animateNumber(statPending, pendingCount);
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

function animateNumber(element, target) {
    const current = parseInt(element.textContent) || 0;
    if (current === target) return;

    const duration = 400;
    const start = performance.now();

    function step(timestamp) {
        const progress = Math.min((timestamp - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        const value = Math.round(current + (target - current) * eased);
        element.textContent = value;
        if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
}

// ===========================
// Calendar
// ===========================
async function renderCalendar() {
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    calMonthTitle.textContent = `${monthNames[calendarMonth]} ${calendarYear}`;

    // Get first day of month and number of days
    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(calendarYear, calendarMonth, 0).getDate();

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Fetch tasks for this month range (include prev/next overflow days)
    const rangeStart = new Date(calendarYear, calendarMonth, 1 - firstDay);
    const totalCells = firstDay + daysInMonth;
    const rows = Math.ceil(totalCells / 7);
    const rangeEnd = new Date(calendarYear, calendarMonth, rows * 7 - firstDay);

    const startStr = formatDateISO(rangeStart);
    const endStr = formatDateISO(rangeEnd);

    try {
        monthTasksCache = await fetchTasksByRange(startStr, endStr);
    } catch (e) {
        monthTasksCache = [];
        console.error('Error fetching calendar tasks:', e);
    }

    // Build a map: dateStr -> { pending: count, completed: count }
    const taskMap = {};
    monthTasksCache.forEach(task => {
        const d = task.taskDate;
        if (!taskMap[d]) taskMap[d] = { pending: 0, completed: 0 };
        if (task.completed) {
            taskMap[d].completed++;
        } else {
            taskMap[d].pending++;
        }
    });

    // Build calendar grid
    let html = '';

    // Previous month overflow
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        const m = calendarMonth === 0 ? 12 : calendarMonth;
        const y = calendarMonth === 0 ? calendarYear - 1 : calendarYear;
        const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        html += buildDayCell(day, dateStr, 'other-month', todayStr, taskMap);
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        let extraClass = '';
        if (dateStr === todayStr) extraClass = 'today';
        if (dateStr === selectedDate) extraClass += ' selected';
        html += buildDayCell(day, dateStr, extraClass.trim(), todayStr, taskMap);
    }

    // Next month overflow
    const totalRendered = firstDay + daysInMonth;
    const remainder = totalRendered % 7;
    if (remainder > 0) {
        const overflow = 7 - remainder;
        for (let day = 1; day <= overflow; day++) {
            const m = calendarMonth === 11 ? 1 : calendarMonth + 2;
            const y = calendarMonth === 11 ? calendarYear + 1 : calendarYear;
            const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            html += buildDayCell(day, dateStr, 'other-month', todayStr, taskMap);
        }
    }

    calGrid.innerHTML = html;
}

function buildDayCell(day, dateStr, extraClass, todayStr, taskMap) {
    const info = taskMap[dateStr];
    let dotsHtml = '';
    if (info) {
        if (info.pending > 0) dotsHtml += '<span class="cal-dot pending"></span>';
        if (info.completed > 0) dotsHtml += '<span class="cal-dot completed"></span>';
    }

    return `
        <div class="cal-day ${extraClass}" data-date="${dateStr}" onclick="selectCalendarDate('${dateStr}')">
            <span class="cal-day-number">${day}</span>
            <div class="cal-day-dots">${dotsHtml}</div>
        </div>
    `;
}

async function selectCalendarDate(dateStr) {
    selectedDate = dateStr;

    // Update selected class
    document.querySelectorAll('.cal-day').forEach(el => {
        el.classList.toggle('selected', el.dataset.date === dateStr);
    });

    // Show tasks for the date
    dayTasksPlaceholder.style.display = 'none';
    dayTasksContent.style.display = 'flex';

    const date = new Date(dateStr + 'T00:00:00');
    const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });
    dayTasksTitle.textContent = `Tasks for ${formattedDate}`;

    try {
        const tasks = await fetchTasksByDate(dateStr);
        dayTasksCount.textContent = `${tasks.length} task${tasks.length !== 1 ? 's' : ''}`;

        if (tasks.length === 0) {
            dayTasksList.style.display = 'none';
            dayTasksEmpty.style.display = 'flex';
        } else {
            dayTasksList.style.display = 'flex';
            dayTasksEmpty.style.display = 'none';

            dayTasksList.innerHTML = tasks.map((task, i) => `
                <div class="day-task-item ${task.completed ? 'is-completed' : ''}" 
                     onclick="openTaskDetail(${task.id})"
                     style="animation-delay: ${i * 0.06}s"
                     title="Click to view details">
                    <div class="day-task-status-dot ${task.completed ? 'completed' : 'pending'}"></div>
                    <div class="day-task-info">
                        <div class="day-task-name">${escapeHtml(task.title)}</div>
                        ${task.taskTime ? `<div class="day-task-time">🕐 ${formatTime(task.taskTime)}</div>` : ''}
                    </div>
                    <span class="day-task-badge ${task.completed ? 'completed' : 'pending'}">
                        ${task.completed ? 'Done' : 'Pending'}
                    </span>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading day tasks:', error);
        showToast('Failed to load tasks for this date', 'error');
    }
}

// ===========================
// Task Detail Modal
// ===========================
async function openTaskDetail(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        const task = await response.json();

        const detailBody = document.getElementById('task-detail-body');
        const statusClass = task.completed ? 'completed' : 'pending';
        const statusText = task.completed ? 'Completed' : 'Pending';
        const statusIcon = task.completed ? '✅' : '⏳';

        detailBody.innerHTML = `
            <div class="detail-status-banner ${statusClass}">
                <div class="detail-status-icon">${statusIcon}</div>
                <div class="detail-status-text">
                    <div class="detail-status-label">Current Status</div>
                    <div class="detail-status-value">${statusText}</div>
                </div>
            </div>

            <div class="detail-fields">
                <div class="detail-field">
                    <span class="detail-field-icon">📝</span>
                    <div class="detail-field-content">
                        <div class="detail-field-label">Task Title</div>
                        <div class="detail-field-value">${escapeHtml(task.title)}</div>
                    </div>
                </div>
                <div class="detail-field">
                    <span class="detail-field-icon">📅</span>
                    <div class="detail-field-content">
                        <div class="detail-field-label">Date</div>
                        <div class="detail-field-value">${formatDate(task.taskDate)}</div>
                    </div>
                </div>
                ${task.taskTime ? `
                <div class="detail-field">
                    <span class="detail-field-icon">🕐</span>
                    <div class="detail-field-content">
                        <div class="detail-field-label">Time</div>
                        <div class="detail-field-value">${formatTime(task.taskTime)}</div>
                    </div>
                </div>
                ` : ''}
                <div class="detail-field">
                    <span class="detail-field-icon">📆</span>
                    <div class="detail-field-content">
                        <div class="detail-field-label">Month</div>
                        <div class="detail-field-value">${task.month || '—'}</div>
                    </div>
                </div>
                ${task.createdAt ? `
                <div class="detail-field">
                    <span class="detail-field-icon">🕑</span>
                    <div class="detail-field-content">
                        <div class="detail-field-label">Created</div>
                        <div class="detail-field-value">${formatDateTime(task.createdAt)}</div>
                    </div>
                </div>
                ` : ''}
            </div>

            <div class="detail-actions">
                <button class="btn ${task.completed ? 'btn-warning' : 'btn-success'}" onclick="handleDetailToggle(${task.id})">
                    ${task.completed ? '↩ Mark Pending' : '✓ Mark Complete'}
                </button>
                <button class="btn btn-secondary" onclick="closeTaskDetail(); openEditModal(${task.id})">
                    ✏️ Edit
                </button>
            </div>
        `;

        taskDetailOverlay.classList.add('active');
    } catch (error) {
        console.error('Error loading task detail:', error);
        showToast('Failed to load task details', 'error');
    }
}

function closeTaskDetail(event) {
    if (event && event.target !== taskDetailOverlay) return;
    taskDetailOverlay.classList.remove('active');
}

async function handleDetailToggle(id) {
    try {
        await toggleTaskStatus(id);
        closeTaskDetail();
        showToast('Task status updated!');
        // Refresh everything
        await loadTasks();
        await renderCalendar();
        if (selectedDate) {
            await selectCalendarDate(selectedDate);
        }
    } catch (error) {
        console.error('Error toggling task:', error);
        showToast('Failed to update status', 'error');
    }
}

// ===========================
// Modal
// ===========================
function openModal() {
    editingTaskId = null;
    modalTitle.textContent = 'Add New Task';
    btnSubmit.innerHTML = '<span class="btn-icon">✓</span> Save Task';
    taskForm.reset();
    setDefaultDate();
    modalOverlay.classList.add('active');
    taskTitleInput.focus();
}

async function openEditModal(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        const task = await response.json();

        editingTaskId = task.id;
        modalTitle.textContent = 'Edit Task';
        btnSubmit.innerHTML = '<span class="btn-icon">✓</span> Update Task';

        taskIdInput.value = task.id;
        taskTitleInput.value = task.title;
        taskDateInput.value = task.taskDate;
        taskTimeInput.value = task.taskTime || '';
        updateMonthDisplay();

        modalOverlay.classList.add('active');
        taskTitleInput.focus();
    } catch (error) {
        console.error('Error loading task:', error);
        showToast('Failed to load task', 'error');
    }
}

function closeModal(event) {
    if (event && event.target !== modalOverlay) return;
    modalOverlay.classList.remove('active');
    editingTaskId = null;
    taskForm.reset();
}

// ===========================
// Form Submit
// ===========================
async function handleFormSubmit(event) {
    event.preventDefault();

    const taskData = {
        title: taskTitleInput.value.trim(),
        taskDate: taskDateInput.value,
        taskTime: taskTimeInput.value || null,
        completed: false
    };

    if (!taskData.title) {
        showToast('Please enter a task title', 'error');
        return;
    }

    try {
        if (editingTaskId) {
            await updateTask(editingTaskId, taskData);
            showToast('Task updated successfully!');
        } else {
            await createTask(taskData);
            showToast('Task created successfully!');
        }

        closeModal();
        await loadTasks();
        await renderCalendar();
        if (selectedDate) {
            await selectCalendarDate(selectedDate);
        }
    } catch (error) {
        console.error('Error saving task:', error);
        showToast('Failed to save task', 'error');
    }
}

// ===========================
// Actions
// ===========================
async function handleToggle(id) {
    try {
        await toggleTaskStatus(id);
        await loadTasks();
        await renderCalendar();
        if (selectedDate) {
            await selectCalendarDate(selectedDate);
        }
        showToast('Task status updated!');
    } catch (error) {
        console.error('Error toggling task:', error);
        showToast('Failed to update status', 'error');
    }
}

async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
        await deleteTask(id);
        await loadTasks();
        await renderCalendar();
        if (selectedDate) {
            await selectCalendarDate(selectedDate);
        }
        showToast('Task deleted!');
    } catch (error) {
        console.error('Error deleting task:', error);
        showToast('Failed to delete task', 'error');
    }
}

// ===========================
// Utilities
// ===========================
function formatDateISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function formatTime(timeStr) {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

function formatDateTime(dtStr) {
    if (!dtStr) return '—';
    const date = new Date(dtStr);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastIcon = document.getElementById('toast-icon');
    const toastMessage = document.getElementById('toast-message');

    toastMessage.textContent = message;

    if (type === 'error') {
        toastIcon.textContent = '✕';
        toastIcon.style.background = 'rgba(239, 68, 68, 0.12)';
        toastIcon.style.color = '#ef4444';
    } else {
        toastIcon.textContent = '✓';
        toastIcon.style.background = 'rgba(16, 185, 129, 0.12)';
        toastIcon.style.color = '#10b981';
    }

    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
