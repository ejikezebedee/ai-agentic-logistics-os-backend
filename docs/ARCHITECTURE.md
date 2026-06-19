# Architecture

## Product

AI-Agentic Smart Logistics Operating System backend.

The system controls four industrial flows:

- Goods flow: package, shipment, warehouse, route, tracking, proof.
- Information flow: order, tracking events, audit logs, notifications, AI recommendations.
- Money flow: payments, escrow accounts, ledger entries, refunds, payouts, commissions, invoices.
- Responsibility flow: custody type, custody actor, assignments, proof, exceptions, approvals.

## Runtime Shape

```text
API Gateway / Backend API
  -> NestJS Modular Monolith
  -> PostgreSQL / Prisma
  -> Redis / BullMQ-ready queues
  -> S3-compatible object storage references
  -> AI Agent Runtime control plane
  -> External providers: payments, maps/GPS, messaging, KYC, carrier APIs, ERP/accounting
```

## Modules

- auth-module
- user-module
- role-permission-module
- merchant-module
- customer-module
- warehouse-module
- inventory-module
- order-module
- shipment-module
- package-module
- disponent-module
- dispatch-module
- route-module
- tracking-module
- driver-module
- fleet-module
- carrier-module
- payment-module
- escrow-ledger-module
- return-module
- dispute-module
- notification-module
- ai-agent-module
- approval-gate-module
- audit-log-module
- analytics-module
- compliance-module
- admin-module

## Logistic Disponent Boundary

The Logistic Disponent / Logistikdisponent is a first-class operational role.

Allowed:

- ready-for-dispatch queue
- tour planning
- driver, vehicle, carrier assignment
- route correction
- delay handling
- failed pickup and failed delivery handling
- manual reassignment
- exception escalation
- live operations monitoring

Blocked:

- ledger edits
- disputed escrow release
- role changes
- audit-log deletion
- user deletion
- finance rule changes

## Immutability

Ledger, audit, tracking, and proof access histories are append-only. Corrections are represented as new reversal/correction records.
