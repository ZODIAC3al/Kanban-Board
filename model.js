import { generateId, saveData } from "./utils.js";

export class Board {
  #boardElem;
  constructor(boardDOMElem) {
    this.id = generateId();
    this.title = "";
    this.columns = [];
    this.#boardElem = boardDOMElem;
    Object.seal(this);
  }
  static fromJson(json, boardDOMElem) {
    const board = new Board(boardDOMElem);
    board.id = json.id;
    board.title = json.title;
    board.columns = json.columns.map((col) => Column.fromJson(col, board));
    board.render();
    return board;
  }

  addColumn(title) {
    const col = new Column(this, title);
    this.columns.push(col);
    this.#boardElem.appendChild(col.getDOMElement());
    saveData(this);
  }
  clearBoard() {
    this.columns = [];
    this.#boardElem.innerHTML = "";
    this.addColumn("To do");
    this.addColumn("In Progress");
    this.addColumn("Done");
  }
  removeColumn(id, colElem) {
    this.columns = this.columns.filter((column) => column.id !== id);
    this.#boardElem.removeChild(colElem);
    saveData(this);
  }
  render() {
    this.#boardElem.innerHTML = "";
    this.columns.forEach((col) => {
      this.#boardElem.appendChild(col.getDOMElement());
    });
    saveData(this);
  }
}

export class Column {
  #colElem;
  #board;
  #hasDOMElement = false;
  constructor(board, title = "") {
    this.id = generateId();
    this.title = title;
    this.tasks = [];
    this.#board = board;
    Object.seal(this);
  }

  static fromJson(json, board) {
    const col = new Column(board, json.title);
    col.id = json.id;
    col.tasks = json.tasks.map((task) => Task.fromJson(task, col));
    return col;
  }

  addTask(task) {
    this.tasks.push(task);
    this.#colElem
      .querySelector(".list-items")
      .appendChild(task.getDOMElement());
    saveData(this.#board);
  }
  removeTask(id, taskElem) {
    this.tasks = this.tasks.filter((task) => task.id !== id);
    this.#colElem.querySelector(".list-items").removeChild(taskElem);
    saveData(this.#board);
  }
  finalizeDrag(task, taskElem) {
    const destColElem = taskElem.closest(".list");
    const destColId = destColElem.dataset.colId;
    const destCol = this.#board.columns.find((col) => col.id === destColId);
    this.tasks = this.tasks.filter((t) => t.id !== task.id);
    destCol.addTask(task);
    task.setColumn(destCol);
  }
  propagateTask(task, taskElem) {
    const currIndx = this.#board.columns.findIndex((col) => col.id === this.id);

    if (currIndx + 1 < this.#board.columns.length) {
      const distCol = this.#board.columns[currIndx + 1];
      distCol.addTask(task);
      task.setColumn(distCol);
      this.tasks = this.tasks.filter((t) => t.id !== task.id);
    } else {
      this.removeTask(task.id, taskElem);
    }
  }
  getDOMElement() {
    if (this.#hasDOMElement) return this.#colElem;
    this.#colElem = document.createElement("div");
    this.#hasDOMElement = true;
    this.#colElem.classList.add("list");
    this.#colElem.classList.add("custom-scroll");
    this.#colElem.dataset.colId = this.id;
    this.#colElem.innerHTML = `
            <div class="list-header"><h2><span class="title-text">${this.title}</span> <span class="edit-col-btn" style="cursor:pointer">✎𓂃</span></h2></div>
            <div class="list-items"></div>
            <div class="list-footer">
                <span class="delete-col-btn" style="cursor:pointer">🗑️</span>
                <span class="add-task-btn" style="cursor:pointer">➕</span>
            </div>
        `;

    this.#colElem
      .querySelector(".edit-col-btn")
      .addEventListener("click", (e) => {
        e.stopPropagation();
        const newTitle = prompt("Enter new column name:", this.title);
        if (newTitle) {
          this.title = newTitle;
          this.#colElem.querySelector(".title-text").innerText = newTitle;
          saveData(this.#board);
        }
      });
    this.#colElem
      .querySelector(".add-task-btn")
      .addEventListener("click", () => {
        const content = prompt("Enter task name");
        if (content) {
          const addedTask = new Task(this, content);
          this.addTask(addedTask);
          this.#colElem
            .querySelector(".list-items")
            .appendChild(addedTask.getDOMElement());
        }
      });
    this.#colElem
      .querySelector(".delete-col-btn")
      .addEventListener("click", () => {
        this.#board.removeColumn(this.id, this.#colElem);
      });
    const listItems = this.#colElem.querySelector(".list-items");
    listItems.addEventListener("dragover", (e) => {
      e.preventDefault();
      const draggable = document.querySelector(".dragging");
      listItems.prepend(draggable);
    });
    this.render();
    return this.#colElem;
  }
  saveData() {
    saveData(this.#board);
  }

  editName(title) {
    this.title = title;
    saveData(this.#board);
  }

  render() {
    this.tasks.forEach((task) => {
      this.#colElem
        .querySelector(".list-items")
        .appendChild(task.getDOMElement());
    });
  }
}

export class Task {
  #taskElem;
  #column;
  #hasDOMElement = false;
  constructor(column, title = "") {
    this.#column = column;
    this.id = generateId();
    this.title = title;
    this.description = "";
    // this.priority = "";
    // this.dueDate = "";
    // this.subtasks = [];
    Object.seal(this);
  }

  static fromJson(json, column) {
    const task = new Task(column, json.title);
    task.id = json.id;
    task.description = json.description;
    return task;
  }
  setColumn(newColumn) {
    this.#column = newColumn;
  }
  getDOMElement() {
    if (this.#hasDOMElement) return this.#taskElem;
    this.#taskElem = document.createElement("div");
    this.#taskElem.classList.add("card");
    this.#taskElem.draggable = true;
    this.#taskElem.dataset.taskId = this.id;
    this.#taskElem.innerHTML = `
            <span class="title-text">${this.title}</span>
            <button class="btn-delete-task">×</button>
            <button class="btn-complete-task">✔️</button>
            <span class="edit-col-btn">✎</span>
        `;

    this.#taskElem
      .querySelector(".btn-delete-task")
      .addEventListener("click", (e) => {
        e.stopPropagation();
        this.#column.removeTask(this.id, this.#taskElem);
        this.#column.saveData();
      });
    this.#taskElem
      .querySelector(".btn-complete-task")
      .addEventListener("click", (e) => {
        e.stopPropagation();
        this.#column.propagateTask(this, this.#taskElem);
        this.#column.saveData();
      });
    this.#taskElem
      .querySelector(".edit-col-btn")
      .addEventListener("click", (e) => {
        e.stopPropagation();
        const newTitle = prompt("Enter new task name:", this.title);
        if (newTitle) {
          this.title = newTitle;
          this.#taskElem.querySelector(".title-text").innerText = newTitle;
          this.#column.saveData();
        }
      });
    this.#taskElem.addEventListener("dragstart", (e) => {
      e.stopPropagation();
      this.#taskElem.classList.add("dragging");
    });
    this.#taskElem.addEventListener("dragend", (e) => {
      e.stopPropagation();
      this.#taskElem.classList.remove("dragging");
      this.#column.finalizeDrag(this, this.#taskElem);
    });
    this.#hasDOMElement = true;
    return this.#taskElem;
  }
}
