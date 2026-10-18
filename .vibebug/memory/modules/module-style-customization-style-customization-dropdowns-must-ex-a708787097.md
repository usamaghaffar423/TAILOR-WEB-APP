---
schemaVersion: 2
id: "module-style-customization-style-customization-dropdowns-must-ex-a708787097"
type: "module"
status: "verified"
priority: "high"
summary: "Style customization dropdowns must expose Delete through styleFieldOptions()/styleSelectionValue() in frontend/src/lib/styleFields.ts: Delete maps to '' so the field is dropped from the save payload (all three form sites send only non-empty style values, OrderController::update replaces style wholesale) and KarigarBillModal builds rows from truthy style values only."
issueId: ""
modules: []
entities: []
paths: ["frontend/src/lib/styleFields.ts", "frontend/src/pages/NewOrder.tsx", "frontend/src/components/orders/EditOrderModal.tsx", "frontend/src/features/sales/pages/NewSalePage.tsx"]
keywords: []
evidence_count: 7
token_estimate: 92
createdAt: "2026-09-30T09:00:42.244Z"
updatedAt: "2026-09-30T09:00:42.244Z"
valid_from_commit: "8dd73001b32ac1e4fc723424116d81fc60233fc6"
---

# Style customization dropdowns must expose Delete through styleFieldOptions()/styleSelectionValue() in frontend/src/lib/styleFields.ts: Delete maps to '' so the field is dropped from the save payload (

Style customization dropdowns must expose Delete through styleFieldOptions()/styleSelectionValue() in frontend/src/lib/styleFields.ts: Delete maps to '' so the field is dropped from the save payload (all three form sites send only non-empty style values, OrderController::update replaces style wholesale) and KarigarBillModal builds rows from truthy style values only.

## Evidence

- Test: npm run build
- Test: npm run lint
- Test: node assertion harness for styleFieldOptions/styleSelectionValue
- Code: frontend/src/lib/styleFields.ts
- Code: frontend/src/pages/NewOrder.tsx
- Code: frontend/src/components/orders/EditOrderModal.tsx
- Code: frontend/src/features/sales/pages/NewSalePage.tsx
