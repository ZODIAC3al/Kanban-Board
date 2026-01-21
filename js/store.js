// store.js
const STORAGE_KEY = "planetx_kanban_data";

// Default data matching the image
const defaultData = [
  {
    id: "col-1",
    title: "To Do",
    colorClass: "todo",
    count: 8,
    tasks: [
      {
        id: "t1",
        title: "UI/UX Design in the age of AI",
        tag: "Important",
        progress: 0,
        comments: 11,
        likes: 187,
        users: [1, 2],
      },
    ],
  },
  {
    id: "col-2",
    title: "In Progress",
    colorClass: "progress",
    count: 2,
    tasks: [
      {
        id: "t4",
        title: "Machine Learning Progress",
        tag: "Important",
        progress: 52,
        comments: 11,
        likes: 187,
        users: [1, 8],
      },
    ],
  },
  {
    id: "col-3",
    title: "Completed",
    colorClass: "done",
    count: 7,
    tasks: [
      {
        id: "t6",
        title: "User flow confirmation for fintech",
        tag: "Important",
        progress: 100,
        comments: 11,
        likes: "2.2K",
        users: [1, 4],
      },
    ],
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
