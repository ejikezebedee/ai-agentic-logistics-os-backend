# Database Schema

The Prisma schema defines the industrial operational model.

## Identity and Access

- users
- sessions
- roles
- permissions
- user_roles
- role_permissions
- customers
- merchants
- drivers
- disponents
- warehouse_staff
- fleet_managers
- carriers

## Warehouse and Inventory

- vehicles
- warehouses
- warehouse_zones
- bins
- products
- skus
- inventory_items
- stock_movements

## Orders and Logistics

- orders
- order_items
- shipments
- packages
- package_events
- tracking_events
- tour_plans
- route_plans
- dispatch_assignments
- pickup_attempts
- delivery_attempts
- proof_of_delivery
- transport_exceptions

## Returns and Disputes

- returns
- disputes
- dispute_evidence

## Finance

- payments
- escrow_accounts
- ledger_entries
- payouts
- refunds
- commissions
- invoices

## Communications and Integrations

- notifications
- documents
- webhook_events

## AI Control Plane

- ai_providers
- ai_agents
- ai_agent_capabilities
- ai_tasks
- ai_context_snapshots
- ai_recommendations
- ai_action_requests
- ai_tool_calls
- ai_approval_gates
- ai_execution_results
- ai_feedback
- ai_risk_assessments

## Governance and Security

- approval_requests
- approval_decisions
- audit_logs
- security_events
- manual_overrides
- ledger_audit_events
- proof_access_logs
- risk_scores

## Migration

Initial migration: `prisma/migrations/20260619113000_initial/migration.sql`.
