from flask import Flask, request, jsonify, render_template
import firebase_admin
from firebase_admin import credentials, firestore
import os
import json

app = Flask(__name__)

# ---------- Firebase Initialization ----------
firebase_key = os.environ.get("FIREBASE_KEY")

if not firebase_admin._apps:
    cred = credentials.Certificate(json.loads(firebase_key))
    firebase_admin.initialize_app(cred)

db = firestore.client()

# ---------- Routes ----------

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/todos", methods=["GET"])
def get_todos():
    user_id = request.args.get("user")
    if not user_id:
        return jsonify([])

    docs = (
        db.collection("todos")
        .where("user", "==", user_id)
        .stream()
    )

    todos = []
    for doc in docs:
        todo = doc.to_dict()
        todo["id"] = doc.id
        todos.append(todo)

    return jsonify(todos)


@app.route("/todos", methods=["POST"])
def add_todo():
    data = request.get_json()

    todo = {
        "text": data["text"],
        "completed": False,
        "priority": data.get("priority", "medium"),
        "dueDate": data.get("dueDate", ""),
        "category": data.get("category", ""),
        "user": data["user"]
    }

    doc_ref = db.collection("todos").add(todo)
    todo["id"] = doc_ref[1].id

    return jsonify(todo), 201


@app.route("/todos/<todo_id>", methods=["PUT"])
def update_todo(todo_id):
    data = request.get_json()

    db.collection("todos").document(todo_id).update(data)
    return jsonify({"status": "updated"})


@app.route("/todos/<todo_id>", methods=["DELETE"])
def delete_todo(todo_id):
    db.collection("todos").document(todo_id).delete()
    return jsonify({"status": "deleted"})


# ---------- Entry Point ----------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
