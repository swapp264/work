# TSC Claim Challan Management System

React + TypeScript/Vite foundation for a controlled Claim Challan pilot.

Run: `npm install`, `npm run dev`. Build: `npm run build`. Test: `npm test`.

Architecture: UI → domain/business rules → repository. A future ERP adapter should implement the ERP boundary server-side. The current build intentionally says **Mock ERP** and does not fabricate Tuhund endpoints.

Primary business controls: OEM-first; customer service in parallel; four-gate closure; centralized status/SLA/validation; CAPA linkage; KPI/OEM performance foundations; responsive register/detail workflow.

See `docs/SOURCE_MAPPING.md`, `docs/RECONCILIATION.md`, and `docs/TESTING.md`.
