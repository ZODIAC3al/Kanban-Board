// ui.js

// Helper to determine badge color based on text
function getBadgeClass(tag) {
  if (tag.includes("Important")) return "badge-important";
  if (tag.includes("High")) return "badge-high";
  if (tag.includes("Meh")) return "badge-meh";
  return "badge-ok";
}

// Helper to get progress bar color based on column/status
function getProgressColor(percent) {
  if (percent === 100) return "#27AE60";
  if (percent > 0) return "#F2994A";
  return "#DFE1E6";
}

export const UI = {
  renderBoard(columns, container) {
    container.innerHTML = columns
      .map(
        (col) => `
      <div class="kanban-col" data-col-id="${col.id}">
        <div class="kanban-col-header">
          <div class="d-flex align-items-center">
            <span class="dot-indicator bg-dot-${col.colorClass}"></span>
            <span class="fs-5">${col.title}</span>
            <span class="text-muted ms-2 fw-normal fs-6">(${col.tasks.length})</span>
          </div>
          <button class="btn btn-sm btn-light rounded-circle add-task-btn" data-col-id="${col.id}">
            <i class="fas fa-plus"></i>
          </button>
        </div>

        <div class="kanban-task-list h-100 custom-scroll" data-col-id="${col.id}">
          ${col.tasks.map((task) => this.createTaskCard(task, col.colorClass)).join("")}
        </div>
      </div>
    `,
      )
      .join("");
  },

  createTaskCard(task, colorContext) {
    const badgeClass = getBadgeClass(task.tag);
    const progressColor = getProgressColor(task.progress);

    // Generate avatars HTML
    const avatars = task.users
      .map(
        (u, index) => `
      <img src="https://i.pravatar.cc/150?img=${u}" 
           class="rounded-circle border border-2 border-white ${index > 0 ? "ms-n2" : ""}" 
           width="24" height="24">
    `,
      )
      .join("");

    return `
      <div class="card task-card p-3" draggable="true" data-task-id="${task.id}">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <span class="badge-soft ${badgeClass}">${task.tag}</span>
          <button class="btn btn-link text-muted p-0 edit-task-btn" style="text-decoration:none;">...</button>
        </div>
        
        <h6 class="card-title mb-3 fw-bold text-dark">${task.title}</h6>
        
        <div class="mb-3">
          <div class="d-flex justify-content-between text-muted small mb-1">
            <span>Progress</span>
            <span>${task.progress}%</span>
          </div>
          <div class="progress">
            <div class="progress-bar" role="progressbar" 
                 style="width: ${task.progress}%; background-color: ${progressColor};" 
                 aria-valuenow="${task.progress}" aria-valuemin="0" aria-valuemax="100"></div>
          </div>
        </div>

        <div class="d-flex justify-content-between align-items-center mt-2 border-top pt-3">
          <div class="d-flex">
            ${avatars}
          </div>
          <div class="d-flex gap-3 text-muted small fw-bold">
            <span><i class="far fa-comment-dots me-1"></i> ${task.comments}</span>
            <span><i class="far fa-check-circle me-1"></i> ${task.likes}</span>
          </div>
        </div>
      </div>
    `;
  },
};
