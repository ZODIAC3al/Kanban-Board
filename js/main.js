// main.js
import { KanbanStore } from "./store.js";
import { UI } from "./ui.js";

let boardData = KanbanStore.getData();
const boardContainer = document.getElementById("board-columns");
const taskModal = new bootstrap.Modal(document.getElementById("taskModal"));

let currentTask = null;
let currentView = "board";
let activeFilter = null;
let isSorted = false;

function init() {
  render();
  setupEventListeners();
}

function render() {
  let dataToRender = structuredClone(boardData);

  // FILTER
  if (activeFilter) {
    dataToRender.forEach((col) => {
      col.tasks = col.tasks.filter((t) => t.tag === activeFilter);
    });
  }

  // SORT
  if (isSorted) {
    dataToRender.forEach((col) => {
      col.tasks.sort((a, b) => b.progress - a.progress);
    });
  }

  // LIST VIEW
  if (currentView === "list") {
    dataToRender = [
      {
        id: "list",
        title: "All Tasks",
        tasks: dataToRender.flatMap((c) => c.tasks),
      },
    ];
  }

  UI.renderBoard(dataToRender, boardContainer);
  setupDragAndDrop();
}

// ---------------- Drag & Drop ----------------
function setupDragAndDrop() {
  if (currentView === "list") return;

  const cards = document.querySelectorAll(".task-card");
  const columns = document.querySelectorAll(".kanban-task-list");

  cards.forEach((card) => {
    card.addEventListener("dragstart", () => card.classList.add("dragging"));
    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
      updateDataModelFromDOM();
    });
  });

  columns.forEach((col) => {
    col.addEventListener("dragover", (e) => {
      e.preventDefault();
      const dragging = document.querySelector(".dragging");
      if (dragging) col.appendChild(dragging);
    });
  });
}

function updateDataModelFromDOM() {
  const newData = [];

  document.querySelectorAll(".kanban-col").forEach((colEl) => {
    const colId = colEl.dataset.colId;
    const oldCol = boardData.find((c) => c.id === colId);

    const taskIds = [...colEl.querySelectorAll(".task-card")].map(
      (t) => t.dataset.taskId,
    );

    const newTasks = [];
    taskIds.forEach((id) => {
      boardData.forEach((c) => {
        const found = c.tasks.find((t) => t.id === id);
        if (found) newTasks.push(found);
      });
    });

    newData.push({ ...oldCol, tasks: newTasks });
  });

  boardData = newData;
  KanbanStore.saveData(boardData);
  render();
}

// ---------------- Events ----------------
function setupEventListeners() {
  // Toolbar buttons
  document.querySelectorAll(".view-toggles button")[0].onclick = () => {
    currentView = "board";
    render();
  };

  document.querySelectorAll(".view-toggles button")[1].onclick = () => {
    currentView = "list";
    render();
  };

  document.querySelectorAll(".actions button")[0].onclick = () => {
    activeFilter = activeFilter ? null : "Important";
    render();
  };

  document.querySelectorAll(".actions button")[1].onclick = () => {
    isSorted = !isSorted;
    render();
  };

  document.getElementById("export-btn").onclick = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(boardData));
    const a = document.createElement("a");
    a.href = dataStr;
    a.download = "board_data.json";
    a.click();
  };

  // Board interactions
  boardContainer.addEventListener("click", (e) => {
    if (e.target.closest(".add-task-btn")) {
      openModal(null, e.target.closest(".add-task-btn").dataset.colId);
    } else if (e.target.closest(".task-card")) {
      const card = e.target.closest(".task-card");
      openModal(
        card.dataset.taskId,
        card.closest(".kanban-col")?.dataset.colId,
      );
    }
  });

  document.getElementById("btn-save-task").onclick = saveTask;
  document.getElementById("btn-delete-task").onclick = deleteTask;
}

// ---------------- Modal ----------------
function openModal(taskId, colId) {
  document.getElementById("task-form").reset();
  document.getElementById("task-col-id").value = colId;

  if (taskId) {
    boardData.forEach((c) => {
      const t = c.tasks.find((t) => t.id === taskId);
      if (t) currentTask = t;
    });

    document.getElementById("task-id").value = currentTask.id;
    document.getElementById("task-title").value = currentTask.title;
    document.getElementById("task-tag").value = currentTask.tag;
    document.getElementById("task-progress").value = currentTask.progress;
    document.getElementById("btn-delete-task").style.display = "block";
  } else {
    currentTask = null;
    document.getElementById("btn-delete-task").style.display = "none";
  }

  taskModal.show();
}

function saveTask() {
  const id = document.getElementById("task-id").value;
  const colId = document.getElementById("task-col-id").value;
  const title = document.getElementById("task-title").value;
  const tag = document.getElementById("task-tag").value;
  const progress = +document.getElementById("task-progress").value;

  if (!title) return alert("Title required");

  if (id) {
    boardData.forEach((c) =>
      c.tasks.forEach((t) => {
        if (t.id === id) {
          t.title = title;
          t.tag = tag;
          t.progress = progress;
        }
      }),
    );
  } else {
    boardData
      .find((c) => c.id === colId)
      .tasks.push({
        id: KanbanStore.generateId(),
        title,
        tag,
        progress,
        comments: 0,
        likes: 0,
        users: [1],
      });
  }

  KanbanStore.saveData(boardData);
  taskModal.hide();
  render();
}

function deleteTask() {
  if (!currentTask) return;
  boardData.forEach(
    (c) => (c.tasks = c.tasks.filter((t) => t.id !== currentTask.id)),
  );
  KanbanStore.saveData(boardData);
  taskModal.hide();
  render();
}

// Start
init();
