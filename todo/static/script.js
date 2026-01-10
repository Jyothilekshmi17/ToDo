// ---------------- USER IDENTIFICATION (NO LOGIN) ----------------
let userId = localStorage.getItem("todoUser");

if (!userId) {
  userId = crypto.randomUUID();
  localStorage.setItem("todoUser", userId);
}

// ---------------- DOM ELEMENTS ----------------
const todoForm = document.getElementById("todoForm");
const todoInput = document.getElementById("todoInput");
const prioritySelect = document.getElementById("prioritySelect");
const dueDateInput = document.getElementById("dueDateInput");
const categoryInput = document.getElementById("categoryInput");

const todoList = document.getElementById("todoList");
const todoCount = document.getElementById("todoCount");
const searchInput = document.getElementById("searchInput");

const filterButtons = document.querySelectorAll(".filter-btn");

// ---------------- STATE ----------------
let todos = [];
let currentFilter = "all";

// ---------------- LOAD TODOS ----------------
async function loadTodos() {
  const res = await fetch(`/todos?user=${userId}`);
  todos = await res.json();
  renderTodos();
}

// ---------------- RENDER TODOS ----------------
function renderTodos() {
  todoList.innerHTML = "";

  let filteredTodos = [...todos];

  // Filter
  if (currentFilter === "active") {
    filteredTodos = filteredTodos.filter(t => !t.completed);
  } else if (currentFilter === "completed") {
    filteredTodos = filteredTodos.filter(t => t.completed);
  } else if (currentFilter === "high") {
    filteredTodos = filteredTodos.filter(t => t.priority === "high");
  }

  // Search
  const searchText = searchInput.value.toLowerCase();
  if (searchText) {
    filteredTodos = filteredTodos.filter(t =>
      t.text.toLowerCase().includes(searchText)
    );
  }

  filteredTodos.forEach(todo => {
    const item = document.createElement("div");
    item.className = `todo-item ${todo.completed ? "completed" : ""}`;

    item.innerHTML = `
      <input type="checkbox" ${todo.completed ? "checked" : ""}>
      <div class="todo-content">
        <span class="todo-text">${todo.text}</span>
        <div class="todo-meta">
          <span class="priority ${todo.priority}">${todo.priority}</span>
          ${todo.category ? `<span class="category">${todo.category}</span>` : ""}
          ${todo.dueDate ? `<span class="due-date">${todo.dueDate}</span>` : ""}
        </div>
      </div>
      <button class="delete-btn"><i class="fas fa-trash"></i></button>
    `;

    // Toggle completed
    item.querySelector("input").addEventListener("change", async e => {
      await fetch(`/todos/${todo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: e.target.checked })
      });
      loadTodos();
    });

    // Delete
    item.querySelector(".delete-btn").addEventListener("click", async () => {
      await fetch(`/todos/${todo.id}`, { method: "DELETE" });
      loadTodos();
    });

    todoList.appendChild(item);
  });

  todoCount.textContent = `${todos.length} tasks`;
}

// ---------------- ADD TODO ----------------
todoForm.addEventListener("submit", async e => {
  e.preventDefault();

  const text = todoInput.value.trim();
  if (!text) return;

  const todo = {
    text,
    priority: prioritySelect.value,
    dueDate: dueDateInput.value,
    category: categoryInput.value,
    user: userId
  };

  await fetch("/todos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(todo)
  });

  todoForm.reset();
  loadTodos();
});

// ---------------- FILTER BUTTONS ----------------
filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    filterButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    renderTodos();
  });
});

// ---------------- SEARCH ----------------
searchInput.addEventListener("input", renderTodos);

// ---------------- INITIAL LOAD ----------------
loadTodos();
