# Reconciliation

## Implemented from governing procedure
- OEM claim is mandatory first; interim Options A/B/C run in parallel.
- Closure requires four gates and cannot be a free dropdown.
- Claim categories preserve the formal procedure terminology.
- Customer Response retains Pending / Approved / Reject.
- OEM Outcome retains Pending / Settled / Rejected / Partial.
- CAPA is linked to Source Claim No.
- KPI targets are centralized.

## Prototype issues corrected
- Removed dependency on proprietary `window.claude.use()` integration.
- Removed `CLM-YYYY-####` claim-number suggestion because it conflicts with the formal procedure's documented format.
- Replaced warning-only OEM-first behavior with validation that blocks interim sourcing/outward without OEM Claim No.
- Separated OEM replacement receipt from credit-note verification.
- Moved workflow/SLA/closure logic into a domain module.
- Isolated pilot localStorage behind a repository interface.

## Explicit unresolved decisions from the expanded requirements
ERP endpoints/authentication/field mappings/unique key/sync frequency; whether OEM data is ERP-owned; exact technical status transitions; exact OEM outcome decision tree; SLA working-vs-calendar rules and start/end events; exception authority; audit-log depth; final mandatory field list after pilot; evidence file storage/retention. These are not silently invented.
