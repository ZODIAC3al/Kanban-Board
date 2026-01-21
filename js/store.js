// store.js
const STORAGE_KEY = "planetx_kanban_data";

// Default data matching the image
const defaultData = [
  {
    id: "col-1",
    title: "To Do",
    colorClass: "todo",
    count: 8,
    tasks: [],
  },
  {
    id: "col-2",
    title: "In Progress",
    colorClass: "progress",
    count: 2,
    tasks: [{}],
  },
  {
    id: "col-3",
    title: "Completed",
    colorClass: "done",
    count: 7,
    tasks: [{}],
  },
];

export const KanbanStore = {
  getData() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : defaultData;
  },

  saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  // Helpers
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },
};
