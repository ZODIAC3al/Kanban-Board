let boardData = [];
let draggedCardId = null;
let draggedSourceColId = null;

loadData();
setupButtons();

function loadData() {
  const data = localStorage.getItem("kanbanBoard");

  if (data) {
    boardData = JSON.parse(data);
  } else {
    // Default Setup
    boardData = [
      { id: generateId(), title: "To Do", tasks: [] },
      { id: generateId(), title: "In Progress", tasks: [] },
      { id: generateId(), title: "Done", tasks: [] },
    ];
    saveData();
  }
  renderBoard();
}

function saveData() {
  localStorage.setItem("kanbanBoard", JSON.stringify(boardData));
}

function generateId() {
  return Math.floor(Math.random() * 100000).toString();
}

function setupButtons() {
  const addColBtn = document.getElementById("add-col-btn");
  const addTaskBtn = document.getElementById("add-task-btn");
  const resetBoardButton = document.getElementById("reset-board-btn");

  addColBtn.addEventListener("click", () => {
    const name = prompt("Enter Column Name:");
    if (name) {
      boardData.push({
        id: generateId(),
        title: name,
        tasks: [],
      });
      saveData();
      renderBoard();
    }
  });

  addTaskBtn.addEventListener("click", () => {
    if (boardData.length === 0) return alert("No columns!");

    const content = prompt("Enter Task Name:");
    if (content) {
      boardData[0].tasks.push({
        id: generateId(),
        content: content,
      });
      saveData();
      renderBoard();
    }
  });

  resetBoardButton.addEventListener("click", () => {
    if (confirm("Reset Board?")) {
      boardData = [
        { id: generateId(), title: "To Do", tasks: [] },
        { id: generateId(), title: "In Progress", tasks: [] },
        { id: generateId(), title: "Done", tasks: [] },
      ];
      saveData();
      renderBoard();
    }
  });
}

function renderBoard() {
  const boardElement = document.querySelector(".board");
  boardElement.innerHTML = "";

  boardData.forEach((column) => {
    const colDiv = document.createElement("div");
    colDiv.classList.add("list");
    colDiv.classList.add("custom-scroll");
    colDiv.dataset.colId = column.id;

    colDiv.innerHTML = `
            <div class="list-header"><h2>${column.title}</h2></div>
            <div class="list-items"></div>
            <div class="list-footer">
                <span class="delete-col-btn" style="cursor:pointer">🗑️</span>
                <span class="add-task-btn" style="cursor:pointer">➕</span>
            </div>
        `;

    colDiv.querySelector(".delete-col-btn").addEventListener("click", () => {
      if (confirm("Delete column?")) {
        boardData = boardData.filter((c) => c.id !== column.id);
        saveData();
        renderBoard();
      }
    });
    colDiv.querySelector(".add-task-btn").addEventListener("click", () => {
      const content = prompt("Enter Task Name:");
      if (content) {
        let colRef = boardData.find((c)=>c.id===column.id)
        colRef.tasks.push({
          id: generateId(),
          content: content,
        });
        saveData();
        renderBoard();
      }
    });

    const listItems = colDiv.querySelector(".list-items");

    column.tasks.forEach((task) => {
      const taskDiv = document.createElement("div");
      taskDiv.classList.add("card");
      taskDiv.draggable = true;
      taskDiv.dataset.taskId = task.id;
      taskDiv.innerHTML = `
                ${task.content} 
                <button class="btn-delete-task">×</button>
            `;

      taskDiv
        .querySelector(".btn-delete-task")
        .addEventListener("click", (e) => {
          e.stopPropagation();
          column.tasks = column.tasks.filter((t) => t.id !== task.id);
          saveData();
          renderBoard();
        });

      taskDiv.addEventListener("dragstart", (e) => {
        taskDiv.classList.add("dragging");
        draggedCardId = task.id;
        draggedSourceColId = column.id;
      });

      taskDiv.addEventListener("dragend", () => {
        taskDiv.classList.remove("dragging");
        finalizeMove(taskDiv);
      });

      listItems.appendChild(taskDiv);
    });

    listItems.addEventListener("dragover", (e) => {
      e.preventDefault();
      const draggable = document.querySelector(".dragging");
      listItems.prepend(draggable);
    });

    boardElement.appendChild(colDiv);
  });
}

function finalizeMove(cardElement) {
  const destColDiv = cardElement.closest(".list");
  const destColId = destColDiv.dataset.colId;

  const sourceCol = boardData.find((c) => c.id === draggedSourceColId);
  const destCol = boardData.find((c) => c.id === destColId);

  const taskIndex = sourceCol.tasks.findIndex((t) => t.id === draggedCardId);
  if (taskIndex != -1) {
    const [movedTask] = sourceCol.tasks.splice(taskIndex, 1);
    destCol.tasks.unshift(movedTask);
    saveData();
  }
}
