// ---------- User Identification (No Login) ----------
let userId = localStorage.getItem("todoUser");

if (!userId) {
  userId = crypto.randomUUID();
  localStorage.setItem("todoUser", userId);
}

// ---------- DOM Elements ----------
const todoInput = document.getElementById("todo-input");
const addBtn = document.getElementById("add-btn");
const todoList = document.getElementById("todo-list");

// ---------- Load Todos ----------
async function loadTodos() {
  const res = await fetch(`/todos?user=${userId}`);
  const todos = await res.json();

  todoList.innerHTML = "";

  todos.forEach(todo => {
    const li = document.createElement("li");
    li.className = "todo-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.completed;

    const span = document.createElement("span");
    span.textContent = todo.text;
    if (todo.completed) span.classList.add("completed");

    checkbox.addEventListener("change", async () => {
      await fetch(`/todos/${todo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: checkbox.checked })
      });

      span.classList.toggle("completed", checkbox.checked);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "❌";
    deleteBtn.className = "delete-btn";

    deleteBtn.addEventListener("click", async () => {
      await fetch(`/todos/${todo.id}`, { method: "DELETE" });
      li.remove();
    });

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(deleteBtn);
    todoList.appendChild(li);
  });
}

// ---------- Add Todo ----------
addBtn.addEventListener("click", async () => {
  const text = todoInput.value.trim();
  if (!text) return;

  await fetch("/todos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, user: userId })
  });

  todoInput.value = "";
  loadTodos();
});

// ---------- Enter Key Support ----------
todoInput.addEventListener("keypress", e => {
  if (e.key === "Enter") addBtn.click();
});

// ---------- Initial Load ----------
loadTodos();
