---
schemaVersion: 2
id: "module-orders-added-edit-button-to-orders-table-rows-pattern-add-5c37467d28"
type: "module"
status: "verified"
priority: "high"
summary: "Added edit button to orders table rows. Pattern: add onEdit callback prop, fetch full Order via ordersApi.show(), render EditOrderModal."
issueId: ""
modules: []
entities: []
paths: ["frontend/src/components/orders/OrderRow.tsx", "frontend/src/components/orders/OrderGroupRow.tsx", "frontend/src/pages/Orders.tsx"]
keywords: []
evidence_count: 4
token_estimate: 34
createdAt: "2026-09-20T10:03:12.105Z"
updatedAt: "2026-09-20T10:03:12.105Z"
valid_from_commit: "d5e2fef94d4be0b514e5baafa72cb29ab8c54d90"
---

# Added edit button to orders table rows. Pattern: add onEdit callback prop, fetch full Order via ordersApi.show(), render EditOrderModal.

Added edit button to orders table rows. Pattern: add onEdit callback prop, fetch full Order via ordersApi.show(), render EditOrderModal.

## Evidence

- Test: tsc --noEmit
- Code: frontend/src/components/orders/OrderRow.tsx
- Code: frontend/src/components/orders/OrderGroupRow.tsx
- Code: frontend/src/pages/Orders.tsx
