# Testing
Automated tests cover working-day calculation, OEM-first validation, closure-gate representation, duplicate/date validation patterns. Run `npm test`.

Manual UAT checklist: create → approval representation → Claim No. → OEM Claim No. → Option A/B/C → customer receipt → OEM replacement/credit → inventory → finance → CAPA → closure; test each closure gate independently; test OEM Pending/Settled/Rejected/Partial; CAPA Open/In Progress/Closed/N/A; invalid dates, quantities and duplicate Claim No.; verify dashboard/report values after edits.

Known pilot limits: no live Tuhund API, no production authentication/RBAC, evidence upload metadata not yet backed by object storage, audit log is not yet server-side immutable, and the full OEM outcome decision tree remains configurable/open.
