/* =========================================
   SECTION 1: UTILITIES (Helpers)
   ========================================= */

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function saveData(mainBoard) {
  localStorage.setItem("kanbanBoard", JSON.stringify(mainBoard));
}

function loadData(mainBoardElem) {
  const data = localStorage.getItem("kanbanBoard");
  let mainBoard;

  if (data) {
    try {
      const parsedObject = JSON.parse(data);
      // We assume Board class is hoisted or defined before execution
      mainBoard = Board.fromJson(parsedObject, mainBoardElem);
    } catch (e) {
      console.error("Corrupt data found, resetting board.", e);
      mainBoard = new Board(mainBoardElem);
      setupDefaultColumns(mainBoard);
    }
  } else {
    mainBoard = new Board(mainBoardElem);
    setupDefaultColumns(mainBoard);
  }
  return mainBoard;
}

function setupDefaultColumns(board) {
  board.addColumn("To Do");
  board.addColumn("In Progress");
  board.addColumn("Done");
}

function saveToPC(fileName, boardData) {
  const jsonString = JSON.stringify(boardData, null, 3);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = fileName
    ? fileName.endsWith(".json")
      ? fileName
      : `${fileName}.json`
    : `kboard-${new Date().toISOString().slice(0, 10)}.json`;

  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);
}

function isValidSchema(data) {
  if (!data || typeof data !== "object") return false;

  // Check Board structure
  if (
    typeof data.id !== "string" ||
    typeof data.title !== "string" ||
    !Array.isArray(data.columns)
  ) {
    return false;
  }

  for (const column of data.columns) {
    // Check Column structure
    if (
      !column ||
      typeof column !== "object" ||
      typeof column.id !== "string" ||
      typeof column.title !== "string" ||
      !Array.isArray(column.tasks)
    ) {
      return false;
    }

    // Check Tasks
    for (const task of column.tasks) {
      const taskContent = task.title || task.content; // Support legacy/new
      if (
        !task ||
        typeof task !== "object" ||
        typeof task.id !== "string" ||
        typeof taskContent !== "string"
      ) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Loads JSON file. Uses callbacks to handle UI (Success/Error)
 * so we don't use alert().
 */
function loadFromPC(mainBoardElem, onSuccess, onError) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";

  input.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonString = event.target.result;
        const data = JSON.parse(jsonString);

        if (isValidSchema(data)) {
          const newBoard = Board.fromJson(data, mainBoardElem);
          if (onSuccess) onSuccess(newBoard);
        } else {
          if (onError)
            onError(
              "Invalid file format: The JSON structure does not match the Kanban schema.",
            );
        }
      } catch (err) {
        if (onError) onError("Error reading file: Could not parse JSON.");
      }
    };
    reader.readAsText(file);
  });

  input.click();
}

/* =========================================
   SECTION 2: CENTRALIZED MODAL CONTROLLER
   ========================================= */

const modal = {
  elem: document.getElementById("custom-modal"),
  title: document.getElementById("modal-title"),
  input: document.getElementById("modal-input"),
  msg: document.getElementById("modal-message"),
  confirmBtn: document.getElementById("modal-confirm"),
  cancelBtn: document.getElementById("modal-cancel"),
  callback: null,

  open(
    type,
    titleText,
    bodyText,
    initialValue = "",
    isDestructive = false,
    onConfirm,
  ) {
    this.title.textContent = titleText;
    this.callback = onConfirm;

    // Reset Visuals
    this.elem.classList.remove("hidden");
    this.confirmBtn.classList.remove("btn-danger");

    if (type === "confirm") {
      // Confirmation Mode: Hide input, show message text
      this.input.classList.add("hidden");
      this.msg.classList.remove("hidden");
      this.msg.textContent = bodyText;
    } else {
      // Input Mode: Show input, hide message text
      this.input.classList.remove("hidden");
      this.msg.classList.add("hidden");
      this.input.placeholder = bodyText;
      this.input.value = initialValue;
      setTimeout(() => this.input.focus(), 100);
    }

    if (isDestructive) {
      this.confirmBtn.classList.add("btn-danger");
    }
  },

  close() {
    this.elem.classList.add("hidden");
    this.callback = null;
    this.input.value = "";
  },
};

// Modal Listeners
modal.confirmBtn.addEventListener("click", () => {
  const isInputMode = !modal.input.classList.contains("hidden");
  const value = modal.input.value.trim();

  if (isInputMode) {
    if (value) {
      if (modal.callback) modal.callback(value);
      modal.close();
    } else {
      modal.input.style.borderColor = "#e74c3c"; // Red shake effect
      setTimeout(() => (modal.input.style.borderColor = ""), 500);
    }
  } else {
    if (modal.callback) modal.callback();
    modal.close();
  }
});

modal.cancelBtn.addEventListener("click", () => modal.close());

modal.input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") modal.confirmBtn.click();
});

/* =========================================
   SECTION 3: CLASSES (Logic & DOM)
   ========================================= */

class Board {
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
    setupDefaultColumns(this);
    saveData(this);
  }

  removeColumn(id, colElem) {
    this.columns = this.columns.filter((column) => column.id !== id);
    colElem.remove();
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

class Column {
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
    taskElem.remove();
    saveData(this.#board);
  }

  finalizeDrag(task, taskElem) {
    const destColElem = taskElem.closest(".list");
    const destColId = destColElem.dataset.colId;
    const destCol = this.#board.columns.find((col) => col.id === destColId);

    // Update Data
    this.tasks = this.tasks.filter((t) => t.id !== task.id);
    destCol.tasks.push(task);
    task.setColumn(destCol);

    saveData(this.#board);
  }

  propagateTask(task, taskElem) {
    const currIndx = this.#board.columns.findIndex((col) => col.id === this.id);

    if (currIndx + 1 < this.#board.columns.length) {
      const nextCol = this.#board.columns[currIndx + 1];
      nextCol.addTask(task); // Adds data and DOM
      task.setColumn(nextCol);
      this.tasks = this.tasks.filter((t) => t.id !== task.id);
      saveData(this.#board);
    } else {
      // Last column -> Delete
      this.removeTask(task.id, taskElem);
    }
  }

  getDOMElement() {
    if (this.#hasDOMElement) return this.#colElem;

    this.#colElem = document.createElement("div");
    this.#colElem.classList.add("list", "custom-scroll");
    this.#colElem.dataset.colId = this.id;

    this.#colElem.innerHTML = `
      <div class="list-header">
        <h2>
            <span class="title-text">${this.title}</span> 
            <span class="edit-col-btn" title="Edit Name">✎</span>
        </h2>
      </div>
      <div class="list-items"></div>
      <div class="list-footer">
        <span class="delete-col-btn" title="Delete Column">Delete Column</span>
        <button class="add-task-btn">Add New Task</button>
      </div>
    `;

    // Internal Drag Listeners
    const listItems = this.#colElem.querySelector(".list-items");
    listItems.addEventListener("dragover", (e) => {
      e.preventDefault();
      const draggable = document.querySelector(".dragging");
      listItems.prepend(draggable);
    });

    this.render();
    this.#hasDOMElement = true;
    return this.#colElem;
  }

  render() {
    const container = this.#colElem.querySelector(".list-items");
    container.innerHTML = "";
    this.tasks.forEach((task) => {
      container.appendChild(task.getDOMElement());
    });
  }
}

class Task {
  #taskElem;
  #column;
  #hasDOMElement = false;

  constructor(column, title = "") {
    this.#column = column;
    this.id = generateId();
    this.title = title;
    this.description = "";
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
      <button class="btn-delete-task" title="Delete">×</button>
      <button class="btn-complete-task" title="Complete">✔️</button>
      <span class="edit-task-btn" title="Edit">✎</span>
    `;

    // Internal Listeners (Complete & Drag only)
    this.#taskElem
      .querySelector(".btn-complete-task")
      .addEventListener("click", (e) => {
        e.stopPropagation();
        this.#column.propagateTask(this, this.#taskElem);
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

/* =========================================
   SECTION 4: INITIALIZATION & DELEGATION
   ========================================= */

const mainBoardElem = document.querySelector(".board");
let mainBoard = loadData(mainBoardElem);

setupHeaderButtons();
setupBoardDelegation();

function setupHeaderButtons() {
  // 1. Add Column
  document.getElementById("add-col-btn").addEventListener("click", () => {
    modal.open(
      "input",
      "New Column",
      "Enter column title...",
      "",
      false,
      (name) => {
        mainBoard.addColumn(name);
      },
    );
  });

  // 2. Reset Board
  document.getElementById("reset-board-btn").addEventListener("click", () => {
    modal.open(
      "confirm",
      "Reset Board?",
      "This will delete all columns and tasks.",
      "",
      true,
      () => {
        mainBoard.clearBoard();
      },
    );
  });

  // 3. Save to PC
  document.getElementById("save-to-pc-btn").addEventListener("click", () => {
    modal.open(
      "input",
      "Save Board",
      "Enter file name...",
      "my-board",
      false,
      (name) => {
        saveToPC(name, mainBoard);
      },
    );
  });

  // 4. Load from PC (Using Callbacks for Error Handling)
  document.getElementById("load-from-pc-btn").addEventListener("click", () => {
    loadFromPC(
      mainBoardElem,
      // Success
      (newBoard) => {
        mainBoard = newBoard;
        saveData(mainBoard);
      },
      // Error (Show in Modal)
      (errorMsg) => {
        modal.open("confirm", "Load Error", errorMsg, "", true);
      },
    );
  });
}

function setupBoardDelegation() {
  // We use Event Delegation to handle dynamic elements
  mainBoardElem.addEventListener("click", (e) => {
    const target = e.target;

    // --- Helpers to find data objects from DOM ---
    const getColumnObj = (domEl) => {
      const colId = domEl.closest(".list").dataset.colId;
      return mainBoard.columns.find((c) => c.id === colId);
    };

    const getTaskObj = (domEl) => {
      const card = domEl.closest(".card");
      const taskId = card.dataset.taskId;
      const col = getColumnObj(domEl);
      return { task: col.tasks.find((t) => t.id === taskId), col, card };
    };

    // --- 1. ADD TASK ---
    if (target.classList.contains("add-task-btn")) {
      const colObj = getColumnObj(target);
      modal.open(
        "input",
        "New Task",
        "What needs to be done?",
        "",
        false,
        (val) => {
          const newTask = new Task(colObj, val);
          colObj.addTask(newTask);
        },
      );
    }

    // --- 2. EDIT COLUMN TITLE ---
    if (target.classList.contains("edit-col-btn")) {
      const colObj = getColumnObj(target);
      const titleSpan = target
        .closest(".list-header")
        .querySelector(".title-text");

      modal.open(
        "input",
        "Edit Column",
        "New name...",
        colObj.title,
        false,
        (val) => {
          colObj.title = val;
          titleSpan.innerText = val;
          saveData(mainBoard);
        },
      );
    }

    // --- 3. DELETE COLUMN ---
    if (target.classList.contains("delete-col-btn")) {
      const colObj = getColumnObj(target);
      const colEl = target.closest(".list");

      modal.open(
        "confirm",
        "Delete Column?",
        "All tasks in this list will be lost.",
        "",
        true,
        () => {
          mainBoard.removeColumn(colObj.id, colEl);
        },
      );
    }

    // --- 4. EDIT TASK CONTENT ---
    if (target.classList.contains("edit-task-btn")) {
      const { task, card } = getTaskObj(target);
      const titleSpan = card.querySelector(".title-text");

      modal.open(
        "input",
        "Edit Task",
        "Task description...",
        task.title,
        false,
        (val) => {
          task.title = val;
          titleSpan.innerText = val;
          saveData(mainBoard);
        },
      );
    }

    // --- 5. DELETE TASK ---
    if (target.classList.contains("btn-delete-task")) {
      const { task, col, card } = getTaskObj(target);

      modal.open(
        "confirm",
        "Delete Task?",
        "Remove this task permanently?",
        "",
        true,
        () => {
          col.removeTask(task.id, card);
        },
      );
    }
  });
}
