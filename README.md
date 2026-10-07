# Registrar Desk

A simple document-request tracker for students and Registrar's Office staff.
Students can submit a request and check its status using a reference number.
Staff can search and filter requests, update statuses, and review request
summaries.

## Run the project

No package installation or build step is required.

1. Open `index.html` in a modern web browser.
2. Use **Student view** to check a request or select **Send a request**.
3. Select **Registrar view** to search, filter, and update requests.

## Features

- Generates reference numbers in the `REQ-YYYY-NNNN` format.
- Assigns each request a fee of 100 and an expected release date five weekdays
  after the request date. Weekends are skipped.
- Supports the status flow **Submitted → Processing → Ready for Pickup →
  Claimed**. Requests in Submitted or Processing may instead be rejected with
  a required reason.
- Records the date when a request is claimed.
- Prevents the same student ID from submitting another request for the same
  document while an earlier request is Submitted or Processing.
- Provides student status lookup and registrar search, status/document filters,
  and request summaries.
- Validates student names, student IDs, reference-number format, and rejection
  reasons.

## Data and limitations

Requests are saved in the browser's `localStorage` on the current device. This
is a front-end prototype: records are not shared between browsers or devices,
and the view tabs do not provide authentication or access control. Do not use
this version to store real student records.

The document fee and weekday turnaround are currently the same for every
document type. The fee value is shown as provided; no currency was specified.
The app seeds sample requests when opened with an empty request store.

## Project files

- `index.html` — student and registrar views and request forms.
- `style.css` — layout, visual styles, and responsive behavior.
- `script.js` — request validation, status workflow, date calculation,
  browser storage, searching, and summaries.
- `docs/requirements-analysis.md` — scenario requirements and implementation
  notes.
- `docs/ai-prompt-log.md` — summary of the prompts used during development.
