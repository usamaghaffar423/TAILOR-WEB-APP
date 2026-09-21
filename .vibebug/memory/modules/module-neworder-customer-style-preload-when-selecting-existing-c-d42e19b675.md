---
schemaVersion: 2
id: "module-neworder-customer-style-preload-when-selecting-existing-c-d42e19b675"
type: "module"
status: "verified"
priority: "high"
summary: "When selecting existing customer on NewOrder page, use customersApi.show() (not getMeasurements) to get both measurements AND style from latest order"
issueId: ""
modules: []
entities: []
paths: ["frontend/src/pages/NewOrder.tsx"]
keywords: []
evidence_count: 2
token_estimate: 38
createdAt: "2026-09-21T07:56:31.695Z"
updatedAt: "2026-09-21T07:56:31.695Z"
valid_from_commit: "358506b15d80fc4566c4edf0d449e147128ade35"
---

# When selecting existing customer on NewOrder page, use customersApi.show() (not getMeasurements) to get both measurements AND style from latest order

When selecting existing customer on NewOrder page, use customersApi.show() (not getMeasurements) to get both measurements AND style from latest order

## Evidence

- Test: tsc --noEmit
- Code: frontend/src/pages/NewOrder.tsx
