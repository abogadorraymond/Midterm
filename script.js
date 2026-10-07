const STORAGE_KEY = "registrar-document-requests";

const starterRequests = [
  {
    id: "REG-2026-1042",
    studentName: "Mia Santos",
    studentId: "2024-01842",
    document: "Transcript of Records",
    dateRequested: "2026-10-06",
    status: "Ready",
  },
  {
    id: "REG-2026-1041",
    studentName: "Noah Garcia",
    studentId: "2023-00617",
    document: "Certificate of Enrollment",
    dateRequested: "2026-10-05",
    status: "Pending",
  },
  {
    id: "REG-2026-1040",
    studentName: "Ava Reyes",
    studentId: "2022-02109",
    document: "Good Moral Certificate",
    dateRequested: "2026-10-04",
    status: "Collected",
  },
  {
    id: "REG-2026-1039",
    studentName: "Ethan Cruz",
    studentId: "2025-00356",
    document: "Transcript of Records",
    dateRequested: "2026-10-03",
    status: "Pending",
  },
  {
    id: "REG-2026-1038",
    studentName: "Sofia Lim",
    studentId: "2023-01428",
    document: "Diploma",
    dateRequested: "2026-10-02",
    status: "Ready",
  },
];

const rowsElement = document.querySelector("#request-rows");
const searchInput = document.querySelector("#search-input");
const statusFilter = document.querySelector("#status-filter");
const emptyState = document.querySelector("#empty-state");
const recordCount = document.querySelector("#record-count");
const requestDialog = document.querySelector("#request-dialog");
const requestForm = document.querySelector("#request-form");
const formError = document.querySelector("#form-error");

let requests = loadRequests();

function loadRequests() {
  const savedRequests = localStorage.getItem(STORAGE_KEY);

  if (savedRequests === null) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(starterRequests));
    return [...starterRequests];
  }

  const parsedRequests = JSON.parse(savedRequests);
  if (!Array.isArray(parsedRequests)) {
    throw new Error("Saved request data must be a list.");
  }

  return parsedRequests;
}

function saveRequests() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
}

function formatDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function createCell(className, text) {
  const cell = document.createElement("td");
  if (className) cell.className = className;
  cell.textContent = text;
  return cell;
}

function createRequestRow(request) {
  const row = document.createElement("tr");
  row.append(createCell("request-id", request.id));

  const studentCell = document.createElement("td");
  studentCell.className = "student-cell";
  const studentName = document.createElement("strong");
  studentName.textContent = request.studentName;
  const studentId = document.createElement("small");
  studentId.textContent = `ID: ${request.studentId}`;
  studentCell.append(studentName, studentId);
  row.append(studentCell);

  row.append(
    createCell("", request.document),
    createCell("", formatDate(request.dateRequested)),
  );

  const statusCell = document.createElement("td");
  const statusSelect = document.createElement("select");
  statusSelect.className = `status-select ${request.status.toLowerCase()}`;
  statusSelect.setAttribute("aria-label", `Status for ${request.id}`);

  [
    ["Pending", "In progress"],
    ["Ready", "Ready for pickup"],
    ["Collected", "Collected"],
  ].forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    option.selected = request.status === value;
    statusSelect.append(option);
  });

  statusSelect.addEventListener("change", () => {
    const matchingRequest = requests.find((item) => item.id === request.id);
    if (!matchingRequest) return;
    matchingRequest.status = statusSelect.value;
    saveRequests();
    renderRequests();
  });

  statusCell.append(statusSelect);
  row.append(statusCell);
  return row;
}

function renderRequests() {
  const searchTerm = searchInput.value.trim().toLocaleLowerCase();
  const selectedStatus = statusFilter.value;
  const filteredRequests = requests
    .filter((request) => {
      const matchesSearch = [
        request.id,
        request.studentName,
        request.studentId,
        request.document,
      ].some((value) => value.toLocaleLowerCase().includes(searchTerm));
      const matchesStatus =
        selectedStatus === "all" || request.status === selectedStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((first, second) =>
      second.dateRequested.localeCompare(first.dateRequested),
    );

  rowsElement.replaceChildren(...filteredRequests.map(createRequestRow));
  emptyState.hidden = filteredRequests.length > 0;
  recordCount.textContent = `${filteredRequests.length} ${
    filteredRequests.length === 1 ? "record" : "records"
  }`;
}

function makeRequestId() {
  const year = new Date().getFullYear();
  const highestSequence = requests.reduce((highest, request) => {
    const match = request.id.match(/^REG-\d{4}-(\d+)$/);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 1000);
  return `REG-${year}-${String(highestSequence + 1).padStart(4, "0")}`;
}

document.querySelector("#new-request-button").addEventListener("click", () => {
  formError.hidden = true;
  requestForm.reset();
  requestForm.elements.dateRequested.value = new Date()
    .toISOString()
    .slice(0, 10);
  requestDialog.showModal();
});

function closeDialog() {
  requestDialog.close();
}

document
  .querySelector("#close-dialog-button")
  .addEventListener("click", closeDialog);
document.querySelector("#cancel-button").addEventListener("click", closeDialog);

requestForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(requestForm);
  const studentName = String(formData.get("studentName")).trim();
  const studentId = String(formData.get("studentId")).trim();
  const documentName = String(formData.get("document"));
  const dateRequested = String(formData.get("dateRequested"));

  if (!studentName || !studentId || !documentName || !dateRequested) {
    formError.textContent = "Please complete all fields before saving.";
    formError.hidden = false;
    return;
  }

  requests.unshift({
    id: makeRequestId(),
    studentName,
    studentId,
    document: documentName,
    dateRequested,
    status: "Pending",
  });
  saveRequests();
  searchInput.value = "";
  statusFilter.value = "all";
  renderRequests();
  closeDialog();
});

searchInput.addEventListener("input", renderRequests);
statusFilter.addEventListener("change", renderRequests);

document.addEventListener("keydown", (event) => {
  if (
    event.key === "/" &&
    !requestDialog.open &&
    !["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement.tagName)
  ) {
    event.preventDefault();
    searchInput.focus();
  }
});

renderRequests();
