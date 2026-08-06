# Deep core operations release

This release replaces the shared generic records for the three highest-value operational areas with dedicated workflows.

## Purchasing and accounts payable

- supplier master and balances
- purchase requests with approval decisions
- supplier quotations and quote-to-order conversion
- purchase orders with received, billed and returned quantities
- goods receipt notes with stock posting
- supplier bills with inventory or expense, input VAT and accounts-payable journals
- supplier payments and bill allocation
- purchase returns with supplier credits, inventory issue and accounting reversal

## Inventory and warehouse

- stock by product and warehouse
- controlled inter-warehouse transfers
- physical stock counts and variance posting
- manual inventory adjustments with accounting journals
- reorder alerts
- lot, expiry and serial-number tracking

## Human resources and payroll

- employee master records
- attendance and overtime
- leave requests and approvals
- effective-dated salary structures
- configurable allowances, deductions, pension rates, tax rates and overtime rates
- payroll calculation, approval, accounting posting and payment journals

Payroll parameters are configurable business inputs and require professional review before statutory filing.

## Validation

Database workflows were verified inside rollback-only transactions. Test records were not retained.