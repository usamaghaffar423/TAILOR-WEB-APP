---
schemaVersion: 2
id: "module-ordergrouprow-customer-name-display-in-ordergrouprow-expa-1d40a3b56a"
type: "module"
status: "verified"
priority: "high"
summary: "In OrderGroupRow expanded child rows, use o.customer_name for Customer column instead of tree connector characters like └ which may render as L in some fonts/browsers"
issueId: ""
modules: []
entities: []
paths: ["frontend/src/components/orders/OrderGroupRow.tsx"]
keywords: []
evidence_count: 2
token_estimate: 42
createdAt: "2026-09-21T07:55:14.374Z"
updatedAt: "2026-09-21T07:55:14.374Z"
valid_from_commit: "358506b15d80fc4566c4edf0d449e147128ade35"
---

# In OrderGroupRow expanded child rows, use o.customer_name for Customer column instead of tree connector characters like └ which may render as L in some fonts/browsers

In OrderGroupRow expanded child rows, use o.customer_name for Customer column instead of tree connector characters like └ which may render as L in some fonts/browsers

## Evidence

- Test: tsc --noEmit
- Code: frontend/src/components/orders/OrderGroupRow.tsx
