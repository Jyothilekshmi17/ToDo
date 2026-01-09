from flask import Flask, render_template, request, jsonify
import json
import os
from datetime import datetime

app = Flask(__name__)

DATA_FILE = 'todos.json'

def load_todos():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    return []

def save_todos(todos):
    with open(DATA_FILE, 'w') as f:
        json.dump(todos, f, indent=2)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/todos', methods=['GET'])
def get_todos():
    user_id = request.args.get('user_id')
    todos = load_todos()

    if user_id:
        todos = [t for t in todos if t.get('user_id') == user_id]

    return jsonify(todos)


@app.route('/api/todos', methods=['POST'])
def add_todo():
    data = request.get_json()
    todos = load_todos()
    
new_todo = {
    'id': len(todos) + 1,
    'user_id': data.get('user_id'),
    'text': data['text'],
    'completed': False,
    'priority': data.get('priority', 'medium'),
    'category': data.get('category', 'general'),
    'created_at': datetime.now().isoformat(),
    'due_date': data.get('due_date')
}
    todos.append(new_todo)
    save_todos(todos)
    return jsonify(new_todo)

@app.route('/api/todos/<int:todo_id>', methods=['PUT'])
def update_todo(todo_id):
    user_id = request.args.get('user_id')
    data = request.get_json()
    todos = load_todos()

    for todo in todos:
        if todo['id'] == todo_id and todo.get('user_id') == user_id:
            todo.update(data)
            break

    save_todos(todos)
    return jsonify({'success': True})


@app.route('/api/todos/<int:todo_id>', methods=['DELETE'])
def delete_todo(todo_id):
    user_id = request.args.get('user_id')
    todos = load_todos()

    todos = [t for t in todos if not (t['id'] == todo_id and t.get('user_id') == user_id)]

    save_todos(todos)
    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

