import { loadData } from "./utils.js";
import { saveToPC, loadFromPC } from "./utils.js";
let mainBoardElem = document.querySelector(".board");

let mainBoard = loadData(mainBoardElem);
setupButtons();

function setupButtons() {
  const addColBtn = document.getElementById("add-col-btn");
  //   const addTaskBtn = document.getElementById("add-task-btn");
  const resetBoardButton = document.getElementById("reset-board-btn");
  const saveToPCButton = document.getElementById("save-to-pc-btn");
  const loadFromPCButton = document.getElementById("load-from-pc-btn");
  addColBtn.addEventListener("click", () => {
    const name = prompt("Enter Column Name:");
    if (name) {
      mainBoard.addColumn(name);
    }
  });

  //   addTaskBtn.addEventListener("click", () => {
  //     if (mainBoard.columns.length === 0) return alert("No columns!");

  //     const content = prompt("Enter Task Name:");
  //     if (content) {
  //       mainBoard.columns[0].addTask(content);
  //     }
  //   });

  resetBoardButton.addEventListener("click", () => {
    if (confirm("Reset Board?")) {
      mainBoard.clearBoard();
    }
  });

  saveToPCButton.addEventListener("click", () => {
    const fileName = prompt("Enter File Name:");
    saveToPC(fileName, mainBoard);
  });
  loadFromPCButton.addEventListener("click", () => {
    loadFromPC(mainBoard, mainBoardElem);
  });
}
