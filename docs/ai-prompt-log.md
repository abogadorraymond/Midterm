# AI Prompt Log

This log summarizes the user prompts that guided the Registrar Desk prototype.
The wording below is condensed for readability; it does not include private
assistant reasoning.

| # | Prompt | Work requested |
|---|---|---|
| 1 | “Create the basic HTML structure for my assigned scenario. Include only the required interface elements and keep the code beginner-friendly. Scenario: Students ask for documents at the Registrar's window. Requests are written in a logbook, so students keep asking ‘Is my document ready?’ and staff cannot find old requests. Build a tracker.” | Create a simple request-tracker interface. |
| 2 | Define request submission and `REQ-YYYY-NNNN` references; show document fees and weekday-based release dates; implement the status workflow and required rejection reasons; provide student lookup and registrar search/filters; prevent active duplicate requests; record claim dates; and summarize requests by status and document type. | Implement tracker behavior. Fee and processing time were clarified as **100 and 5 weekdays for every document type**. |
| 3 | “add input validation” | Validate user-entered request, lookup, and rejection fields. |
| 4 | “fix the desing make it user friendly” | Improve the student and registrar interface, readability, and mobile layout. |
| 5 | “Refactor this JavaScript to reduce repeated code while keeping the same functionality. Explain the changes.” | Consolidate repeated JavaScript logic without changing behavior. |
| 6 | Request the files `README.md`, `docs/requirements-analysis.md`, and `docs/ai-prompt-log.md`. | Document the project, requirements, and development prompts. |
