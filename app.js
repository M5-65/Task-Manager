// Task Management
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentId = 1;

// Modal Functions
function openModal() {
    document.getElementById('taskModal').style.display = 'block';
    // Set default date to today
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('dueDate').value = now.toISOString().slice(0, 16);
}

function closeModal() {
    document.getElementById('taskModal').style.display = 'none';
    document.getElementById('taskForm').reset();
}

// Form Handling
function handleSubmit(event) {
    event.preventDefault();
    
    const task = {
        id: currentId++,
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        dueDate: document.getElementById('dueDate').value,
        assignee: document.getElementById('assignee').value,
        priority: document.getElementById('priority').value,
        status: 'todo',
        createdAt: new Date().toISOString()
    };

    tasks.push(task);
    saveTasks();
    renderTasks();
    closeModal();
}

// Task Management Functions
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function renderTasks() {
    const columns = {
        todo: document.getElementById('todo'),
        inProgress: document.getElementById('inProgress'),
        done: document.getElementById('done')
    };

    // Clear all columns
    Object.values(columns).forEach(column => column.innerHTML = '');

    // Render tasks
    tasks.forEach(task => {
        const taskElement = createTaskElement(task);
        columns[task.status].appendChild(taskElement);
    });
}

function createTaskElement(task) {
    const div = document.createElement('div');
    div.className = 'task-card';
    div.draggable = true;
    div.id = `task-${task.id}`;
    
    div.innerHTML = `
        <h3>${task.title}</h3>
        <p>${task.description}</p>
        <div class="task-meta">
            <span class="priority-${task.priority}">${task.priority}</span>
            <span>${task.assignee || 'Unassigned'}</span>
            <span>${new Date(task.dueDate).toLocaleDateString()}</span>
        </div>
    `;

    // Add drag event listeners
    div.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', task.id);
    });

    return div;
}

// Drag and Drop Functions
function allowDrop(e) {
    e.preventDefault();
}

function drop(e) {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    const newStatus = e.target.closest('.task-list').id;
    
    const task = tasks.find(t => t.id === parseInt(taskId));
    if (task) {
        task.status = newStatus;
        saveTasks();
        renderTasks();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderTasks();
});

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('taskModal');
    if (event.target === modal) {
        closeModal();
    }
}

// Task Manager Class
class TaskManager {
    constructor() {
        this.tasks = safeLocalStorageOperation(
            () => JSON.parse(localStorage.getItem('tasks'))
        ) || [];
        this.currentId = this.tasks.length > 0 ? Math.max(...this.tasks.map(task => task.id)) + 1 : 1;
        this.init();
    }

    init() {
        // Initialize event listeners
        document.getElementById('add-task-btn').addEventListener('click', () => this.showModal());
        document.querySelector('.close').addEventListener('click', () => this.hideModal());
        document.getElementById('task-form').addEventListener('submit', (e) => this.handleFormSubmit(e));

        // Initialize reminders
        this.checkReminders();
        setInterval(() => this.checkReminders(), 60000); // Check every minute

        // Load tasks
        this.renderTasks();
    }

    showModal() {
        document.getElementById('task-modal').style.display = 'block';
        // Set default date to today
        const today = new Date();
        const dateString = today.toISOString().slice(0, 16); // Format: YYYY-MM-DDThh:mm
        document.getElementById('task-due-date').value = dateString;
    }

    hideModal() {
        document.getElementById('task-modal').style.display = 'none';
        document.getElementById('task-form').reset();
    }

    handleFormSubmit(e) {
        e.preventDefault();
        
        const task = {
            id: this.currentId++,
            title: document.getElementById('task-title').value,
            description: document.getElementById('task-description').value,
            dueDate: document.getElementById('task-due-date').value,
            assignee: document.getElementById('task-assignee').value,
            priority: document.getElementById('task-priority').value,
            status: 'todo',
            createdAt: new Date().toISOString()
        };

        this.tasks.push(task);
        this.saveTasks();
        this.renderTasks();
        this.hideModal();
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    renderTasks() {
        const columns = {
            todo: document.querySelector('#todo .task-list'),
            'in-progress': document.querySelector('#in-progress .task-list'),
            done: document.querySelector('#done .task-list')
        };

        // Clear all columns
        Object.values(columns).forEach(column => column.innerHTML = '');

        // Render tasks in appropriate columns
        this.tasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            columns[task.status].appendChild(taskElement);
        });
    }

    createTaskElement(task) {
        const div = document.createElement('div');
        div.className = 'task-card';
        div.draggable = true;
        div.id = `task-${task.id}`;
        
        div.innerHTML = `
            <h3>${task.title}</h3>
            <p>${task.description}</p>
            <div class="task-meta">
                <span class="priority ${task.priority}">${task.priority}</span>
                <span class="assignee">${task.assignee}</span>
                <span class="due-date">${new Date(task.dueDate).toLocaleDateString()}</span>
            </div>
        `;

        // Add drag event listeners
        div.addEventListener('dragstart', (e) => this.handleDragStart(e, task));
        
        return div;
    }

    handleDragStart(e, task) {
        e.dataTransfer.setData('text/plain', task.id);
    }

    updateTaskStatus(taskId, newStatus) {
        const task = this.tasks.find(t => t.id === parseInt(taskId));
        if (task) {
            task.status = newStatus;
            this.saveTasks();
            this.renderTasks();
        }
    }

    checkReminders() {
        const now = new Date();
        this.tasks.forEach(task => {
            const dueDate = new Date(task.dueDate);
            const timeDiff = dueDate - now;
            
            // Notify 1 hour before due date
            if (timeDiff > 0 && timeDiff <= 3600000 && !task.reminded) {
                this.showNotification(task);
                task.reminded = true;
                this.saveTasks();
            }
        });
    }

    showNotification(task) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`Task Due Soon: ${task.title}`, {
                body: `The task "${task.title}" is due in less than an hour!`,
                icon: 'path-to-your-icon.png'
            });
        }
    }

    initializeListView() {
        // Add event listeners for filters and sort
        document.getElementById('priority-filter').addEventListener('change', () => this.filterAndRenderTasks());
        document.getElementById('status-filter').addEventListener('change', () => this.filterAndRenderTasks());
        document.getElementById('sort-by').addEventListener('change', () => this.filterAndRenderTasks());
        
        // Add event listener for list view add task button
        document.getElementById('add-task-btn-list').addEventListener('click', () => this.showModal());
    }

    filterAndRenderTasks() {
        const priorityFilter = document.getElementById('priority-filter').value;
        const statusFilter = document.getElementById('status-filter').value;
        const sortBy = document.getElementById('sort-by').value;

        let filteredTasks = this.tasks.filter(task => {
            const priorityMatch = priorityFilter === 'all' || task.priority === priorityFilter;
            const statusMatch = statusFilter === 'all' || task.status === statusFilter;
            return priorityMatch && statusMatch;
        });

        // Sort tasks
        filteredTasks.sort((a, b) => {
            switch(sortBy) {
                case 'date-asc':
                    return new Date(a.dueDate) - new Date(b.dueDate);
                case 'date-desc':
                    return new Date(b.dueDate) - new Date(a.dueDate);
                case 'priority':
                    const priorityOrder = { high: 1, medium: 2, low: 3 };
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                default:
                    return 0;
            }
        });

        this.renderTaskTable(filteredTasks);
    }

    renderTaskTable(tasks) {
        const tableBody = document.getElementById('task-table-body');
        tableBody.innerHTML = '';

        tasks.forEach(task => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${task.title}</td>
                <td>${task.description}</td>
                <td>${new Date(task.dueDate).toLocaleString()}</td>
                <td>${task.assignee}</td>
                <td><span class="priority ${task.priority}">${task.priority}</span></td>
                <td>${task.status}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn secondary" onclick="taskManager.editTask(${task.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn danger" onclick="taskManager.deleteTask(${task.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            // Populate modal with task data
            document.getElementById('task-title').value = task.title;
            document.getElementById('task-description').value = task.description;
            document.getElementById('task-due-date').value = task.dueDate;
            document.getElementById('task-assignee').value = task.assignee;
            document.getElementById('task-priority').value = task.priority;
            
            // Show modal
            this.showModal();
            
            // Update form submit handler
            const form = document.getElementById('task-form');
            form.onsubmit = (e) => {
                e.preventDefault();
                task.title = document.getElementById('task-title').value;
                task.description = document.getElementById('task-description').value;
                task.dueDate = document.getElementById('task-due-date').value;
                task.assignee = document.getElementById('task-assignee').value;
                task.priority = document.getElementById('task-priority').value;
                
                this.saveTasks();
                this.renderTasks();
                this.filterAndRenderTasks();
                this.hideModal();
                
                // Reset form submit handler
                form.onsubmit = (e) => this.handleFormSubmit(e);
            };
        }
    }

    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.saveTasks();
            this.renderTasks();
            this.filterAndRenderTasks();
        }
    }
}

// Improved drag and drop handlers
function allowDrop(e) {
    e.preventDefault();
    const taskList = e.target.closest('.task-list');
    if (taskList) {
        taskList.classList.add('drag-over');
    }
}

function dragLeave(e) {
    const taskList = e.target.closest('.task-list');
    if (taskList) {
        taskList.classList.remove('drag-over');
    }
}

function drop(e) {
    e.preventDefault();
    const taskList = e.target.closest('.task-list');
    if (taskList) {
        taskList.classList.remove('drag-over');
    }
    
    const taskId = e.dataTransfer.getData('text/plain');
    const newStatus = e.target.closest('.column').id;
    
    if (newStatus && taskId) {
        taskManager.updateTaskStatus(taskId, newStatus);
    }
}

// Error handling wrapper for localStorage
function safeLocalStorageOperation(operation, ...args) {
    try {
        return operation(...args);
    } catch (error) {
        console.error('localStorage operation failed:', error);
        return null;
    }
}

// Add navigation functionality
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Update active link
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        // Show corresponding page
        const pageId = link.dataset.page + '-page';
        document.querySelectorAll('.page').forEach(page => {
            page.classList.add('hidden');
        });
        document.getElementById(pageId).classList.remove('hidden');
        
        // Update tasks view
        if (pageId === 'list-page') {
            taskManager.filterAndRenderTasks();
        }
    });
});

// Initialize Task Manager
const taskManager = new TaskManager();
taskManager.initializeListView();

// Request notification permission
if ('Notification' in window) {
    Notification.requestPermission();
} 