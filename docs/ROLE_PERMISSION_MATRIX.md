# Role Permission Matrix

Status: Milestone 6 frontend reference.

## Roles

| Role | Frontend areas | Notes |
| --- | --- | --- |
| `customer` | Orders, returns, tracking | Own-resource access only. |
| `merchant` | Merchant orders, inventory, handoff | Own merchant resources only. |
| `shipper` | Shipment operations | Operational update scope. |
| `warehouse_staff` | Pick, scan, pack, stage | Cannot mark finance or admin actions. |
| `warehouse_manager` | Warehouse dashboard, package readiness | Can mark ready for dispatch. |
| `driver` | Jobs, pickup, delivery, location | Driver app role. |
| `fleet_manager` | Fleet and vehicles | No finance authority. |
| `carrier` | Carrier jobs | External-carrier scope. |
| `freight_forwarder` | International route handover | Route/carrier comparison scope. |
| `logistic_disponent` | Queue, tours, assignment, live map, exceptions | Cannot edit ledger, release disputed escrow, delete audit, change roles, or delete users. |
| `support_agent` | Disputes, notifications, support cases | No finance release rights. |
| `finance_admin` | Escrow, refunds, ledger read, payouts | Finance approval authority. |
| `compliance_admin` | Audit, security, privacy, compliance | Read and governance authority. |
| `super_admin` | Full platform administration | Development smoke tests use this role where needed. |
| `ai_agent` | AI recommendations and approval requests | Cannot bypass approval gates or mutate finance/audit history directly. |

## 7C Endpoint Role Matrix

| Endpoint | Allowed roles |
| --- | --- |
| `POST /orders/:id/confirm` | `customer`, `merchant`, `super_admin` |
| `POST /returns` | `customer`, `support_agent`, `super_admin` |
| `POST /returns/:id/status` | `support_agent`, `warehouse_manager`, `finance_admin`, `super_admin` |
| `POST /warehouse/pick/start` | `warehouse_staff`, `warehouse_manager`, `super_admin` |
| `POST /warehouse/scan` | `warehouse_staff`, `warehouse_manager`, `super_admin` |
| `POST /warehouse/pack` | `warehouse_staff`, `warehouse_manager`, `super_admin` |
| `POST /warehouse/ready-for-dispatch` | `warehouse_staff`, `warehouse_manager`, `super_admin` |
| `POST /dispatch/assign-driver` | `logistic_disponent`, `super_admin` |
| `POST /drivers/pickup/:shipmentId/complete` | `driver`, `super_admin` |
| `POST /shipments/:id/deliver` | `driver`, `logistic_disponent`, `super_admin` |
| `POST /escrow/release` | `finance_admin`, `super_admin` |
| `POST /approvals/refunds/:id/approve` | `finance_admin`, `compliance_admin`, `super_admin` |
| `POST /ai/approvals/:id/approve` | `compliance_admin`, `finance_admin`, `super_admin` |
| `POST /ai/providers/:id/test` | `compliance_admin`, `super_admin` |
| `POST /auth/2fa/setup` | Any authenticated user |
| `POST /auth/2fa/verify` | Any authenticated user |

For Codex integration, either send a Bearer JWT from `POST /auth/login` or send development actor headers with a role listed above. Missing or mismatched roles intentionally return `403`.

Development actor header behavior:

| Header | Accepted format | Notes |
| --- | --- | --- |
| `x-actor-id` | string | Required with dev actor headers. |
| `x-actor-roles` | comma string or JSON array string | Examples: `merchant`, `warehouse_staff,warehouse_manager`, `["driver"]`. |
| `x-actor-permissions` | comma string or JSON array string | May satisfy a route only when the permission is explicitly mapped to one of that route's allowed roles, or when `*` is supplied by a trusted dev actor. |

Documented development aliases normalize as follows: `admin`, `super`, `superadmin`, `platform_admin`, and `platformadmin` to `super_admin`; `disponent`, `dispatcher`, `logistics_disponent`, `logistics_dispatcher`, `logistics_manager`, and `logistic_dispatcher` to `logistic_disponent`; `warehouse`, `warehouse_worker`, and `warehouse_operator` to `warehouse_staff`; `warehouse_admin`, `warehouse_supervisor`, and `warehouse_lead` to `warehouse_manager`; `support`, `support_admin`, and `customer_support` to `support_agent`; `finance`, `finance_manager`, and `finance_officer` to `finance_admin`; `compliance` and `compliance_officer` to `compliance_admin`; `ai` to `ai_agent`.

Integration 7E note: permission-based dev access does not bypass RBAC. It only maps explicit permissions from `ROLE_PERMISSIONS` to the same allowed role matrix above. A customer actor still receives `403` for dispatch assignment, refund approval, AI provider testing, and finance/compliance routes.

## Status Enums

Frontend should treat these values as closed enums for Milestone 6:

- `OrderStatus`: `draft`, `quoted`, `booked`, `payment_pending`, `payment_authorized`, `inventory_reserved`, `warehouse_processing`, `ready_for_dispatch`, `transport_planned`, `driver_assigned`, `picked_up`, `in_transit`, `out_for_delivery`, `delivery_attempted`, `delivered`, `proof_accepted`, `settlement_pending`, `completed`, `cancelled`
- `ShipmentStatus`: `created`, `awaiting_dispatch`, `planned`, `assigned`, `pickup_scheduled`, `picked_up`, `in_transit`, `at_hub`, `sorted`, `out_for_delivery`, `delivered`, `failed`, `returned`, `lost`, `damaged`
- `PackageStatus`: `created`, `reserved`, `picking`, `scanned`, `packed`, `label_generated`, `staged`, `ready_for_dispatch`, `dispatched`, `delivered`, `returned`, `quarantined`, `damaged`, `lost`
- `PaymentStatus`: `not_required`, `pending`, `authorized`, `captured`, `held_in_escrow`, `partially_released`, `released`, `refunded`, `partially_refunded`, `chargeback`, `failed`
- `DisputeStatus`: `none`, `opened`, `evidence_collecting`, `under_review`, `decision_pending`, `resolved_customer`, `resolved_merchant`, `resolved_driver`, `resolved_platform`, `closed`
- `ReturnStatus`: `return_requested`, `return_approved`, `return_rejected`, `return_pickup_planned`, `return_picked_up`, `return_received`, `inspection_pending`, `refund_pending`, `refund_completed`, `restocked`, `discarded`, `closed`
- `AiRiskLevel`: `L1_LOW`, `L2_MEDIUM`, `L3_HIGH`, `L4_CRITICAL`, `L5_PROHIBITED`
- `ApprovalStatus`: `pending`, `approved`, `rejected`, `expired`, `cancelled`
