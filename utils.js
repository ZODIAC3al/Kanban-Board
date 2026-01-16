import { Board } from "./model.js";

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
export function loadData(mainBoardElem) {
  const data = localStorage.getItem("kanbanBoard");
  let mainBoard;
  if (data) {
    const parsedObject = JSON.parse(data);
    mainBoard = Board.fromJson(parsedObject, mainBoardElem);
  } else {
    mainBoard = new Board(mainBoardElem);
  }
  return mainBoard;
}
export function saveData(mainBoard) {
  localStorage.setItem("kanbanBoard", JSON.stringify(mainBoard));
}

export function saveToPC(fileName, boardData) {
  const jsonString = JSON.stringify(boardData, null, 3);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = fileName
    ? fileName
    : `kboard-${new Date().toISOString().slice(0, 10)}.json`;
  downloadLink.click();
  URL.revokeObjectURL(url);
}

export function isValidSchema(data) {
  if (!data || typeof data !== "object") return false;

  // Check if it's the Board object structure (id, title, columns)
  if (
    typeof data.id !== "string" ||
    typeof data.title !== "string" ||
    !Array.isArray(data.columns)
  ) {
    return false;
  }

  for (const column of data.columns) {
    // Check column structure
    if (
      !column ||
      typeof column !== "object" ||
      typeof column.id !== "string" ||
      typeof column.title !== "string" ||
      !Array.isArray(column.tasks)
    ) {
      return false;
    }

    // Check tasks within the column
    for (const task of column.tasks) {
      // Support both 'title' (new) and 'content' (old) for task content
      const taskContent = task.title || task.content;
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

export function loadFromPC(mainBoardObj, mainBoardElem) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.addEventListener("change", (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const jsonString = e.target.result;
      const data = JSON.parse(jsonString);
      if (isValidSchema(data)) {
        mainBoardObj = Board.fromJson(data, mainBoardElem);
      } else {
        alert("Invalid file format");
      }
    };
    reader.readAsText(file);
  });
  input.click();
}
