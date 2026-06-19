# State Machines

Statuses are represented as Prisma enums and TypeScript enums. Loose status strings are avoided for core operational state.

## Order

draft -> quoted -> booked -> payment_pending -> payment_authorized -> inventory_reserved -> warehouse_processing -> ready_for_dispatch -> transport_planned -> driver_assigned -> picked_up -> in_transit -> out_for_delivery -> delivered -> proof_accepted -> settlement_pending -> completed

Cancellation is allowed only before terminal operational completion.

## Shipment

created -> awaiting_dispatch -> planned -> assigned -> pickup_scheduled -> picked_up -> in_transit -> at_hub -> sorted -> out_for_delivery -> delivered

Exception paths:

- pickup_scheduled -> failed
- in_transit -> failed | lost | damaged
- out_for_delivery -> failed | returned
- damaged -> returned

## Payment

pending -> authorized -> captured -> held_in_escrow -> partially_released -> released

Exception paths:

- captured or escrow states -> refunded | partially_refunded | chargeback
- pending or authorized -> failed

## Dispute

none -> opened -> evidence_collecting -> under_review -> decision_pending -> resolved_customer | resolved_merchant | resolved_driver | resolved_platform -> closed

Dispute resolution requires evidence.

## Return

return_requested -> return_approved -> return_pickup_planned -> return_picked_up -> return_received -> inspection_pending -> refund_pending -> refund_completed -> closed

Alternative endings:

- return_requested -> return_rejected -> closed
- inspection_pending -> restocked -> closed
- inspection_pending -> discarded -> closed

## Mandatory Invariants

- No driver assignment before package readiness.
- No dispatch without scan.
- No pickup completion without scan, OTP, or proof.
- No delivery completion without required proof.
- No delivery completion outside GPS tolerance unless Disponent approval exists.
- No escrow release before accepted proof.
- No escrow release while an active dispute exists.
- No dispute resolution without evidence.
- No refund without ledger entry.
- No audit, tracking, proof, or ledger deletion.
- No AI high-risk or critical execution without approval.
- No AI prohibited action ever.
