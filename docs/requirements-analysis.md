# Requirements Analysis

## Scenario

Students submit document requests at the Registrar's Office. A paper logbook
makes it difficult for students to check progress and for staff to find older
requests. The tracker provides a searchable request register and a student
reference-number lookup.

## Users

- **Student:** submits a document request and checks its status, expected
  release date, and fee using its reference number.
- **Registrar staff:** reviews all requests, searches and filters records, and
  updates request statuses.

## Functional requirements

1. A student can submit a request with a name, student ID, and document type.
2. Each request receives a unique-looking `REQ-YYYY-NNNN` reference number
   and starts in **Submitted** status.
3. Each document type has a fee of **100** and an expected release date five
   weekdays after submission. Saturday and Sunday are not counted.
4. The supported statuses are **Submitted**, **Processing**, **Ready for
   Pickup**, **Claimed**, and **Rejected**.
5. The allowed status transitions are:
   - Submitted → Processing or Rejected
   - Processing → Ready for Pickup or Rejected
   - Ready for Pickup → Claimed
   - Claimed and Rejected are terminal statuses.
6. A rejection requires a nonblank reason, which is retained with the request.
7. A request can only be claimed from **Ready for Pickup**; claiming records
   the current date.
8. A student can look up a request by reference number. The result shows only
   its status, expected release date, and fee.
9. Registrar staff can search by student name, student ID, or reference
   number, and filter by status and document type.
10. A student ID cannot submit another request for the same document while a
    previous request is **Submitted** or **Processing**.
11. The registrar view summarizes requests by status and document type.
12. Invalid student details, document selections, reference numbers, and
    rejection reasons receive validation feedback.

## Usability and quality requirements

- Present separate student and registrar views.
- Use clear labels, readable text, keyboard focus indicators, and responsive
  layouts for desktop and mobile screens.
- Keep the implementation usable as a static page without a build step.
- Store records between page reloads in the current browser.

## Assumptions and scope

- The fee is **100 for every document type** and the processing time is **five
  weekdays for every document type**, based on the supplied requirements.
- No currency was specified, so the interface displays the fee as `100`
  without a currency symbol.
- Weekday calculation skips Saturdays and Sundays; public holidays are not
  included.
- Records are stored in browser `localStorage`. This prototype does not
  synchronize records between users or devices.
- The view switch is for demonstration, not authentication. A production
  service would need protected staff access and shared, secure data storage.
- Sample requests are added when the app first opens with no saved request
  data.

## Acceptance checks

- Submitting valid request details creates a Submitted record with a reference
  number, fee, and weekday-based expected release date.
- Invalid names, IDs, reference numbers, and blank rejection reasons are
  rejected with a useful message.
- An active duplicate for the same student ID and document is rejected.
- A request cannot skip a status in the workflow or be claimed before it is
  Ready for Pickup.
- A valid claim records a claim date; a valid rejection stores its reason.
- Student lookup returns only status, expected release date, and fee.
- Registrar search, both filters, and the status/document summaries reflect
  the saved requests.
