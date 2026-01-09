class TodoApp {
    constructor() {
        this.todos = [];
        this.currentFilter = 'all';
        this.selectedTodos = new Set();
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadTodos();
        this.initTheme();
    }

    bindEvents() {
        // Form submission
        document.getElementById('todoForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTodo();
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // Search
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.search(e.target.value);
        });

        // Bulk actions
        document.getElementById('selectAll').addEventListener('click', () => {
            this.selectAll();
        });

        document.getElementById('deleteSelected').addEventListener('click', () => {
            this.deleteSelected();
        });

        document.getElementById('clearCompleted').addEventListener('click', () => {
            this.clearCompleted();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'a' && e.target.tagName !== 'INPUT') {
                    e.preventDefault();
                    this.selectAll();
                }
            }
        });
    }

    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeIcon(newTheme);
    }

    updateThemeIcon(theme) {
        const icon = document.querySelector('#themeToggle i');
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    async loadTodos() {
        try {
            const response = await fetch('/api/todos');
            this.todos = await response.json();
            this.renderTodos();
            this.updateStats();
        } catch (error) {
            this.showNotification('Failed to load todos', 'error');
        }
    }

    async addTodo() {
        const text = document.getElementById('todoInput').value.trim();
        const priority = document.getElementById('prioritySelect').value;
        const dueDate = document.getElementById('dueDateInput').value;
        const category = document.getElementById('categoryInput').value.trim();

        if (!text) return;

        try {
            const response = await fetch('/api/todos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text,
                    priority,
                    due_date: dueDate || null,
                    category: category || 'general'
                })
            });

            const newTodo = await response.json();
            this.todos.push(newTodo);
            this.renderTodos();
            this.updateStats();
            this.clearForm();
            this.showNotification('Todo added successfully!', 'success');
        } catch (error) {
            this.showNotification('Failed to add todo', 'error');
        }
    }

    async updateTodo(id, updates) {
        try {
            await fetch(`/api/todos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });

            const todo = this.todos.find(t => t.id === id);
            Object.assign(todo, updates);
            this.renderTodos();
            this.updateStats();
        } catch (error) {
            this.showNotification('Failed to update todo', 'error');
        }
    }

    async deleteTodo(id) {
        try {
            await fetch(`/api/todos/${id}`, { method: 'DELETE' });
            this.todos = this.todos.filter(t => t.id !== id);
            this.selectedTodos.delete(id);
            this.renderTodos();
            this.updateStats();
            this.showNotification('Todo deleted', 'success');
        } catch (error) {
            this.showNotification('Failed to delete todo', 'error');
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.renderTodos();
    }

    search(query) {
        this.searchQuery = query.toLowerCase();
        this.renderTodos();
    }

    getFilteredTodos() {
        let filtered = [...this.todos];

        // Apply filter
        switch (this.currentFilter) {
            case 'active':
                filtered = filtered.filter(t => !t.completed);
                break;
            case 'completed':
                filtered = filtered.filter(t => t.completed);
                break;
            case 'high':
                filtered = filtered.filter(t => t.priority === 'high');
                break;
        }

        // Apply search
        if (this.searchQuery) {
            filtered = filtered.filter(t => 
                t.text.toLowerCase().includes(this.searchQuery) ||
                t.category.toLowerCase().includes(this.searchQuery)
            );
        }

        return filtered;
    }

    renderTodos() {
        const todoList = document.getElementById('todoList');
        const filtered = this.getFilteredTodos();

        if (filtered.length === 0) {
            todoList.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    <i class="fas fa-clipboard-list" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>No todos found</p>
                </div>
            `;
            return;
        }

        todoList.innerHTML = filtered.map(todo => this.renderTodoItem(todo)).join('');
    }

    renderTodoItem(todo) {
        const isSelected = this.selectedTodos.has(todo.id);
        const dueDate = todo.due_date ? new Date(todo.due_date).toLocaleDateString() : '';
        const isOverdue = todo.due_date && new Date(todo.due_date) < new Date() && !todo.completed;

        return `
            <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" onclick="app.toggleTodo(${todo.id})"></div>
                <div class="todo-content">
                    <div class="todo-text ${isOverdue ? 'overdue' : ''}">${todo.text}</div>
                    <div class="todo-meta">
                        <span class="priority ${todo.priority}">${todo.priority}</span>
                        <span class="category">${todo.category}</span>
                        ${dueDate ? `<span class="due-date ${isOverdue ? 'overdue' : ''}">${dueDate}</span>` : ''}
                    </div>
                </div>
                <div class="todo-actions">
                    <button class="btn-sm btn-secondary" onclick="app.toggleSelect(${todo.id})" title="Select">
                        <i class="fas fa-${isSelected ? 'check-square' : 'square'}"></i>
                    </button>
                    <button class="btn-sm btn-danger" onclick="app.deleteTodo(${todo.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        this.updateTodo(id, { completed: !todo.completed });
    }

    toggleSelect(id) {
        if (this.selectedTodos.has(id)) {
            this.selectedTodos.delete(id);
        } else {
            this.selectedTodos.add(id);
        }
        this.renderTodos();
    }

    selectAll() {
        const filtered = this.getFilteredTodos();
        if (this.selectedTodos.size === filtered.length) {
            this.selectedTodos.clear();
        } else {
            filtered.forEach(todo => this.selectedTodos.add(todo.id));
        }
        this.renderTodos();
    }

    async deleteSelected() {
        if (this.selectedTodos.size === 0) return;
        
        if (confirm(`Delete ${this.selectedTodos.size} selected todos?`)) {
            for (const id of this.selectedTodos) {
                await this.deleteTodo(id);
            }
            this.selectedTodos.clear();
        }
    }

    async clearCompleted() {
        const completed = this.todos.filter(t => t.completed);
        if (completed.length === 0) return;

        if (confirm(`Clear ${completed.length} completed todos?`)) {
            for (const todo of completed) {
                await this.deleteTodo(todo.id);
            }
        }
    }

    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(t => t.completed).length;
        const active = total - completed;
        
        document.getElementById('todoCount').textContent = 
            `${active} active, ${completed} completed`;
    }

    clearForm() {
        document.getElementById('todoInput').value = '';
        document.getElementById('dueDateInput').value = '';
        document.getElementById('categoryInput').value = '';
        document.getElementById('prioritySelect').value = 'medium';
    }

    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type} show`;
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

// Initialize app
const app = new TodoApp();