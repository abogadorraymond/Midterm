const STORAGE_KEY = "registrar-document-requests";
const REQUEST_FEE = 100;
const PROCESSING_WEEKDAYS = 5;
const DOCUMENT_TYPES = [
  "Transcript of Records",
  "Certificate of Enrollment",
  "Good Moral Certificate",
  "Diploma",
  "Other document",
];
const REQUEST_STATUSES = [
  "Submitted",
  "Processing",
  "Ready for Pickup",
  "Claimed",
  "Rejected",
];
const LEGACY_STATUSES = {
  Pending: "Processing",
  Ready: "Ready for Pickup",
  Collected: "Claimed",
};
const STATUS_TRANSITIONS = {
  Submitted: ["Processing", "Rejected"],
  Processing: ["Ready for Pickup", "Rejected"],
  "Ready for Pickup": ["Claimed"],
  Claimed: [],
  Rejected: [],
};
const SUMMARY_GROUPS = [
  {
    selector: "#status-summary",
    labels: REQUEST_STATUSES,
    getValue: (request) => request.status,
  },
  {
    selector: "#document-summary",
    labels: DOCUMENT_TYPES,
    getValue: (request) => request.document,
  },
];
const STARTER_REQUESTS = [
  {
    referenceNumber: "REQ-2026-0001",
    studentName: "Mia Santos",
    studentId: "2024-01842",
    document: "Transcript of Records",
    dateRequested: "2026-10-06",
    status: "Ready for Pickup",
  },
  {
    referenceNumber: "REQ-2026-0002",
    studentName: "Noah Garcia",
    studentId: "2023-00617",
    document: "Certificate of Enrollment",
    dateRequested: "2026-10-05",
    status: "Processing",
  },
  {
    referenceNumber: "REQ-2026-0003",
    studentName: "Ava Reyes",
    studentId: "2022-02109",
    document: "Good Moral Certificate",
    dateRequested: "2026-10-04",
    status: "Claimed",
    claimDate: "2026-10-07",
  },
  {
    referenceNumber: "REQ-2026-0004",
    studentName: "Ethan Cruz",
    studentId: "2025-00356",
    document: "Transcript of Records",
    dateRequested: "2026-10-03",
    status: "Submitted",
  },
  {
    referenceNumber: "REQ-2026-0005",
    studentName: "Sofia Lim",
    studentId: "2023-01428",
    document: "Diploma",
    dateRequested: "2026-10-02",
    status: "Rejected",
    rejectionReason: "Please provide a valid student ID.",
  },
];

const studentTab = document.querySelector("#student-tab");
const registrarTab = document.querySelector("#registrar-tab");
const studentView = document.querySelector("#student-view");
const registrarView = document.querySelector("#registrar-view");
const requestDialog = document.querySelector("#request-dialog");
const requestForm = document.querySelector("#request-form");
const formError = document.querySelector("#form-error");
const lookupForm = document.querySelector("#lookup-form");
const referenceInput = document.querySelector("#reference-input");
const lookupError = document.querySelector("#lookup-error");
const lookupResult = document.querySelector("#lookup-result");
const rejectionDialog = document.querySelector("#rejection-dialog");
const rejectionForm = document.querySelector("#rejection-form");
const rejectionError = document.querySelector("#rejection-error");
const searchInput = document.querySelector("#search-input");
const statusFilter = document.querySelector("#status-filter");
const documentFilter = document.querySelector("#document-filter");
const rowsElement = document.querySelector("#request-rows");
const emptyState = document.querySelector("#empty-state");
const recordCount = document.querySelector("#record-count");
const summaryElements = SUMMARY_GROUPS.map((group) => ({
  ...group,
  element: document.querySelector(group.selector),
}));

let requests = loadRequests();
let pendingRejectionReference = null;

function getTodayDate() {
  return toDateString(new Date());
}

function toDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addWeekdays(dateString, weekdayCount) {
  const date = parseDate(dateString);
  let weekdaysAdded = 0;

  while (weekdaysAdded < weekdayCount) {
    date.setDate(date.getDate() + 1);
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      weekdaysAdded += 1;
    }
  }

  return toDateString(date);
}

function formatDate(dateString) {
  if (!dateString) return "—";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parseDate(dateString));
}

function migrateRequest(request, index) {
  const status =
    LEGACY_STATUSES[request.status] || request.status || "Submitted";
  if (!REQUEST_STATUSES.includes(status)) {
    throw new Error(`Request ${request.id || request.referenceNumber} has an unknown status.`);
  }

  const oldReference = request.referenceNumber || request.id;
  const referenceMatch = oldReference?.match(/^(?:REG|REQ)-(\d{4})-(\d+)$/);
  const referenceNumber = referenceMatch
    ? `REQ-${referenceMatch[1]}-${referenceMatch[2].padStart(4, "0")}`
    : `REQ-${new Date().getFullYear()}-${String(index + 1).padStart(4, "0")}`;
  const dateRequested = request.dateRequested || getTodayDate();

  return {
    referenceNumber,
    studentName: request.studentName,
    studentId: request.studentId,
    document: request.document,
    dateRequested,
    fee: REQUEST_FEE,
    expectedReleaseDate: addWeekdays(dateRequested, PROCESSING_WEEKDAYS),
    status,
    claimDate: request.claimDate || "",
    rejectionReason: request.rejectionReason || "",
  };
}

function loadRequests() {
  const savedRequests = localStorage.getItem(STORAGE_KEY);

  if (savedRequests === null) {
    const starterRecords = STARTER_REQUESTS.map(migrateRequest);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(starterRecords));
    return starterRecords;
  }

  const parsedRequests = JSON.parse(savedRequests);
  if (!Array.isArray(parsedRequests)) {
    throw new Error("Saved request data must be a list.");
  }

  const migratedRequests = parsedRequests.map(migrateRequest);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedRequests));
  return migratedRequests;
}

function saveRequests() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
}

function makeReferenceNumber() {
  const year = new Date().getFullYear();
  const highestSequence = requests.reduce((highest, request) => {
    const match = request.referenceNumber.match(/^REQ-(\d{4})-(\d+)$/);
    if (!match || Number(match[1]) !== year) return highest;
    return Math.max(highest, Number(match[2]));
  }, 0);

  return `REQ-${year}-${String(highestSequence + 1).padStart(4, "0")}`;
}

function createCell(className, text) {
  const cell = document.createElement("td");
  if (className) cell.className = className;
  cell.textContent = text;
  return cell;
}

function allowedNextStatuses(status) {
  return STATUS_TRANSITIONS[status] || [];
}

function createStatusSelect(request) {
  const statusSelect = document.createElement("select");
  statusSelect.className = `status-select ${request.status
    .toLocaleLowerCase()
    .replaceAll(" ", "-")}`;
  statusSelect.setAttribute("aria-label", `Status for ${request.referenceNumber}`);

  [request.status, ...allowedNextStatuses(request.status)].forEach((status) => {
    const option = document.createElement("option");
    option.value = status;
    option.textContent = status;
    option.selected = status === request.status;
    statusSelect.append(option);
  });

  statusSelect.addEventListener("change", () => {
    const nextStatus = statusSelect.value;
    if (!allowedNextStatuses(request.status).includes(nextStatus)) {
      renderRequests();
      return;
    }

    if (nextStatus === "Rejected") {
      pendingRejectionReference = request.referenceNumber;
      rejectionForm.reset();
      rejectionError.hidden = true;
      rejectionDialog.showModal();
      return;
    }

    request.status = nextStatus;
    if (nextStatus === "Claimed") {
      request.claimDate = getTodayDate();
    }
    saveRequests();
    renderAll();
  });

  return statusSelect;
}

function createRequestRow(request) {
  const row = document.createElement("tr");
  row.append(createCell("request-id", request.referenceNumber));

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
    createCell("", String(request.fee)),
    createCell("", formatDate(request.expectedReleaseDate)),
  );

  const statusCell = document.createElement("td");
  statusCell.append(createStatusSelect(request));
  row.append(statusCell);
  row.append(createCell("", formatDate(request.claimDate)));
  row.append(createCell("rejection-reason", request.rejectionReason || "—"));
  return row;
}

function renderRequests() {
  const searchTerm = searchInput.value.trim().toLocaleLowerCase();
  const selectedStatus = statusFilter.value;
  const selectedDocument = documentFilter.value;
  const filteredRequests = requests
    .filter((request) => {
      const matchesSearch = [
        request.referenceNumber,
        request.studentName,
        request.studentId,
      ].some((value) => value.toLocaleLowerCase().includes(searchTerm));
      const matchesStatus =
        selectedStatus === "all" || request.status === selectedStatus;
      const matchesDocument =
        selectedDocument === "all" || request.document === selectedDocument;
      return matchesSearch && matchesStatus && matchesDocument;
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

function renderSummaryList(element, labels, getValue) {
  element.replaceChildren(
    ...labels.map((label) => {
      const item = document.createElement("li");
      const name = document.createElement("span");
      name.textContent = label;
      const count = document.createElement("strong");
      count.textContent = String(
        requests.filter((request) => getValue(request) === label).length,
      );
      item.append(name, count);
      return item;
    }),
  );
}

function renderSummary() {
  summaryElements.forEach(({ element, labels, getValue }) => {
    renderSummaryList(element, labels, getValue);
  });
}

function renderAll() {
  renderRequests();
  renderSummary();
}

function showView(view) {
  const isStudentView = view === "student";
  studentView.hidden = !isStudentView;
  registrarView.hidden = isStudentView;
  studentTab.classList.toggle("active", isStudentView);
  registrarTab.classList.toggle("active", !isStudentView);
  studentTab.setAttribute("aria-selected", String(isStudentView));
  registrarTab.setAttribute("aria-selected", String(!isStudentView));
}

function showLookupResult(request) {
  document.querySelector("#result-status").textContent = request.status;
  document.querySelector("#result-release-date").textContent = formatDate(
    request.expectedReleaseDate,
  );
  document.querySelector("#result-fee").textContent = String(request.fee);
  lookupResult.hidden = false;
}

function showFormError(errorElement, message, input) {
  errorElement.textContent = message;
  errorElement.hidden = false;
  input?.focus();
}

studentTab.addEventListener("click", () => showView("student"));
registrarTab.addEventListener("click", () => {
  showView("registrar");
  renderAll();
});

document.querySelector("#new-request-button").addEventListener("click", () => {
  formError.hidden = true;
  requestForm.reset();
  requestDialog.showModal();
});

function closeRequestDialog() {
  requestDialog.close();
}

document
  .querySelector("#close-dialog-button")
  .addEventListener("click", closeRequestDialog);
document.querySelector("#cancel-button").addEventListener("click", closeRequestDialog);

requestForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(requestForm);
  const studentName = String(formData.get("studentName"))
    .trim()
    .replace(/\s+/g, " ");
  const studentId = String(formData.get("studentId")).trim();
  const documentName = String(formData.get("document"));
  const studentNameInput = requestForm.elements.namedItem("studentName");
  const studentIdInput = requestForm.elements.namedItem("studentId");
  const documentInput = requestForm.elements.namedItem("document");

  if (
    studentName.length < 2 ||
    studentName.length > 100 ||
    !/\p{L}/u.test(studentName) ||
    /[^\p{L}\p{M}\s.'’-]/u.test(studentName)
  ) {
    showFormError(
      formError,
      "Enter a valid name using letters, spaces, apostrophes, periods, or hyphens.",
      studentNameInput,
    );
    return;
  }

  if (!/^[A-Za-z0-9][A-Za-z0-9-]{1,29}$/.test(studentId)) {
    showFormError(
      formError,
      "Enter a student ID with 2–30 letters, numbers, or hyphens.",
      studentIdInput,
    );
    return;
  }

  if (!DOCUMENT_TYPES.includes(documentName)) {
    showFormError(formError, "Select a document type.", documentInput);
    return;
  }

  const normalizedStudentId = studentId.toLocaleLowerCase();
  const hasActiveDuplicate = requests.some(
    (request) =>
      request.studentId.trim().toLocaleLowerCase() === normalizedStudentId &&
      request.document === documentName &&
      ["Submitted", "Processing"].includes(request.status),
  );
  if (hasActiveDuplicate) {
    showFormError(
      formError,
      "You already have an active request for this document.",
      studentIdInput,
    );
    return;
  }

  const dateRequested = getTodayDate();
  const request = {
    referenceNumber: makeReferenceNumber(),
    studentName,
    studentId,
    document: documentName,
    dateRequested,
    fee: REQUEST_FEE,
    expectedReleaseDate: addWeekdays(dateRequested, PROCESSING_WEEKDAYS),
    status: "Submitted",
    claimDate: "",
    rejectionReason: "",
  };

  requests.unshift(request);
  saveRequests();
  renderAll();
  document.querySelector("#submission-reference").textContent =
    request.referenceNumber;
  document.querySelector("#submission-confirmation").hidden = false;
  showView("student");
  closeRequestDialog();
});

lookupForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const referenceNumber = referenceInput.value.trim().toLocaleUpperCase();
  if (
    referenceNumber.length > 30 ||
    !/^REQ-\d{4}-\d{4,}$/.test(referenceNumber)
  ) {
    lookupResult.hidden = true;
    showFormError(
      lookupError,
      "Enter a reference number like REQ-2026-0001.",
      referenceInput,
    );
    return;
  }

  const matchingRequest = requests.find(
    (request) => request.referenceNumber.toLocaleUpperCase() === referenceNumber,
  );

  if (!matchingRequest) {
    lookupResult.hidden = true;
    showFormError(
      lookupError,
      "No request was found with that reference number.",
    );
    return;
  }

  lookupError.hidden = true;
  showLookupResult(matchingRequest);
});

function closeRejectionDialog() {
  pendingRejectionReference = null;
  rejectionDialog.close();
  renderRequests();
}

document
  .querySelector("#close-rejection-button")
  .addEventListener("click", closeRejectionDialog);
document
  .querySelector("#cancel-rejection-button")
  .addEventListener("click", closeRejectionDialog);

rejectionForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const reason = String(new FormData(rejectionForm).get("reason")).trim();
  if (!reason) {
    showFormError(
      rejectionError,
      "Enter a reason before rejecting the request.",
      rejectionForm.elements.namedItem("reason"),
    );
    return;
  }
  if (reason.length > 500) {
    showFormError(
      rejectionError,
      "Keep the rejection reason to 500 characters or fewer.",
      rejectionForm.elements.namedItem("reason"),
    );
    return;
  }

  const request = requests.find(
    (item) => item.referenceNumber === pendingRejectionReference,
  );
  if (!request || !allowedNextStatuses(request.status).includes("Rejected")) {
    closeRejectionDialog();
    return;
  }

  request.status = "Rejected";
  request.rejectionReason = reason;
  saveRequests();
  pendingRejectionReference = null;
  rejectionDialog.close();
  renderAll();
});

searchInput.addEventListener("input", renderRequests);
statusFilter.addEventListener("change", renderRequests);
documentFilter.addEventListener("change", renderRequests);

[
  [requestForm, formError],
  [lookupForm, lookupError],
  [rejectionForm, rejectionError],
].forEach(([form, errorElement]) => {
  form.addEventListener("input", () => {
    errorElement.hidden = true;
    if (form === lookupForm) lookupResult.hidden = true;
  });
});

renderAll();
