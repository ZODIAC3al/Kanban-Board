import { KanbanStore } from "./store.js";
import { UI } from "./ui.js";

let boardData = KanbanStore.getData();
const boardContainer = document.getElementById("board-columns");
const taskModal = new bootstrap.Modal(document.getElementById("taskModal"));

let currentTask = null;
let currentView = "board";
let activeFilter = null; // null means "All"
let isSorted = false;

function init() {
  render();
  setupEventListeners();
}

function render() {
  // 1. Clone data to avoid mutating the original source
  let dataToRender = JSON.parse(JSON.stringify(boardData));

  // 2. FILTER LOGIC
  if (activeFilter && activeFilter !== "All") {
    dataToRender.forEach((col) => {
      col.tasks = col.tasks.filter((t) => t.tag === activeFilter);
    });
  }

  // 3. SORT LOGIC
  if (isSorted) {
    dataToRender.forEach((col) => {
      col.tasks.sort((a, b) => b.progress - a.progress);
    });
  }

  // 4. LIST VIEW TRANSFORM
  if (currentView === "list") {
    const allTasks = [];
    dataToRender.forEach((col) => {
      // Add column name to task for context in list view if needed
      allTasks.push(...col.tasks);
    });

    dataToRender = [
      {
        id: "list-view",
        title: "All Tasks",
        tasks: allTasks,
        colorClass: "todo", // Default color
      },
    ];
  }

  UI.renderBoard(dataToRender, boardContainer);

  // Only enable drag and drop if we are in Board view and NOT filtering/sorting
  // (dragging while filtered causes data loss or weird reordering)
  if (currentView === "board" && !activeFilter && !isSorted) {
    setupDragAndDrop();
  }
}

// ---------------- Drag & Drop ----------------
function setupDragAndDrop() {
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

    // Get task IDs in new order
    const taskIds = [...colEl.querySelectorAll(".task-card")].map(
      (t) => t.dataset.taskId,
    );

    const newTasks = [];
    taskIds.forEach((id) => {
      // Find task object in original data
      for (const c of boardData) {
        const found = c.tasks.find((t) => t.id === id);
        if (found) {
          newTasks.push(found);
          break;
        }
      }
    });

    newData.push({ ...oldCol, tasks: newTasks });
  });

  boardData = newData;
  KanbanStore.saveData(boardData);
  render();
}

// ---------------- Events ----------------
function setupEventListeners() {
  // 1. View Toggles (Board vs List)
  const viewBtns = document.querySelectorAll("#view-mode-group button");
  if (viewBtns.length >= 2) {
    viewBtns[0].onclick = () => {
      currentView = "board";
      toggleViewClasses(0);
      render();
    };
    viewBtns[1].onclick = () => {
      currentView = "list";
      toggleViewClasses(1);
      render();
    };
  }

  // 2. FILTER FUNCTIONALITY (Fix)
  // Listen to clicks on the Dropdown Items specifically
  const filterItems = document.querySelectorAll("[data-filter]");
  filterItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();

      // Visual: Update 'active' class on dropdown
      filterItems.forEach((el) => el.classList.remove("active"));
      e.target.classList.add("active");

      // Logic: Set filter
      const selectedFilter = e.target.getAttribute("data-filter");
      activeFilter = selectedFilter === "All" ? null : selectedFilter;

      render();
    });
  });

  // 3. SORT FUNCTIONALITY
  const sortItems = document.querySelectorAll("[data-sort]");
  sortItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      // Visual
      sortItems.forEach((el) => el.classList.remove("active"));
      e.target.classList.add("active");

      // Logic (Simple toggle for now based on your previous code, or strictly by progress)
      // If you want strictly progress sort:
      isSorted = e.target.getAttribute("data-sort") === "progress-desc";
      render();
    });
  });

  // 4. Export
  document.getElementById("export-btn").onclick = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(boardData));
    const a = document.createElement("a");
    a.href = dataStr;
    a.download = "board_data.json";
    a.click();
  };

  // 5. Board Interactions (Edit/Add)
  boardContainer.addEventListener("click", (e) => {
    // Add Button
    const addBtn = e.target.closest(".add-task-btn");
    if (addBtn) {
      openModal(null, addBtn.dataset.colId);
      return;
    }

    // Edit Card
    const card = e.target.closest(".task-card");
    // Ignore clicks on buttons inside the card to prevent double triggers if any
    if (card && !e.target.closest("button")) {
      openModal(
        card.dataset.taskId,
        card.closest(".kanban-col")?.dataset.colId,
      );
    }
    // Also handle specific edit button click if exists
    if (e.target.closest(".edit-task-btn")) {
      const c = e.target.closest(".task-card");
      openModal(c.dataset.taskId, c.closest(".kanban-col")?.dataset.colId);
    }
  });

  document.getElementById("btn-save-task").onclick = saveTask;
  document.getElementById("btn-delete-task").onclick = deleteTask;
}

// Helper to toggle active class on view buttons
function toggleViewClasses(activeIndex) {
  const btns = document.querySelectorAll("#view-mode-group button");
  btns.forEach((b) => b.classList.remove("active-view"));
  if (btns[activeIndex]) btns[activeIndex].classList.add("active-view");
}

// ---------------- Modal ----------------
function openModal(taskId, colId) {
  const form = document.getElementById("task-form");
  if (form) form.reset();

  document.getElementById("task-col-id").value = colId || "";

  if (taskId) {
    // Find task across all columns
    let foundTask = null;
    for (const col of boardData) {
      const t = col.tasks.find((x) => x.id === taskId);
      if (t) {
        foundTask = t;
        break;
      }
    }
    currentTask = foundTask;

    if (currentTask) {
      document.getElementById("task-id").value = currentTask.id;
      document.getElementById("task-title").value = currentTask.title;
      document.getElementById("task-tag").value = currentTask.tag;
      document.getElementById("task-progress").value = currentTask.progress;
      // Trigger input event to update output number visually
      document
        .getElementById("task-progress")
        .dispatchEvent(new Event("input"));

      const delBtn = document.getElementById("btn-delete-task");
      if (delBtn) delBtn.style.display = "block";
    }
  } else {
    currentTask = null;
    document.getElementById("task-id").value = "";
    const delBtn = document.getElementById("btn-delete-task");
    if (delBtn) delBtn.style.display = "none";
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
    // EDIT EXISTING
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
    // CREATE NEW
    const col = boardData.find((c) => c.id === colId);
    if (col) {
      col.tasks.push({
        id: KanbanStore.generateId(),
        title,
        tag,
        progress,
        comments: 0,
        likes: 0,
        users: [1],
      });
    }
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
