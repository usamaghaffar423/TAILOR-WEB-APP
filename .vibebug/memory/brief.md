# VibeBug memory brief

Use `vibebug memory context "<issue terms>" --json`; do not preload the index.

- **module-orders-added-edit-button-to-orders-table-rows-pattern-add-5c37467d28** [verified/module]: Added edit button to orders table rows. Pattern: add onEdit callback prop, fetch full Order via ordersApi.show(), render EditOrderModal.
- **module-neworder-customer-style-preload-when-selecting-existing-c-d42e19b675** [verified/module]: When selecting existing customer on NewOrder page, use customersApi.show() (not getMeasurements) to get both measurements AND style from latest order
- **module-ordergrouprow-customer-name-display-in-ordergrouprow-expa-1d40a3b56a** [verified/module]: In OrderGroupRow expanded child rows, use o.customer_name for Customer column instead of tree connector characters like └ which may render as L in some fonts/browsers
- **project-architecture** [generated/project]: Generated package and source-area map.
- **project-conventions** [generated/project]: Repository conventions verified or proposed during issue work.
- **project-overview** [generated/project]: Generated project identity, languages, and frameworks.
- **project-testing** [generated/project]: Generated test commands and test-file inventory.
