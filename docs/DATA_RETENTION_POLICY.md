# Data Retention Policy

## Status

Milestone 5 readiness policy. Legal approval is required before production deployment.

## Audit Retention

- Audit logs, approval records, AI action requests, security events, and manual override records are immutable application records.
- Minimum retention target: 7 years for regulated operational and finance-adjacent events.
- Deletion is blocked at application level. Production archival must use append-only storage with signed export manifests.

## Proof and Evidence Retention

- Pickup photos, delivery photos, signatures, warehouse packing proof, and dispute evidence are retained for the shipment/dispute lifecycle plus the legally approved claims window.
- Minimum retention target: 24 months after order closure unless local law requires longer.
- Evidence under active dispute, claim, chargeback, investigation, or audit hold must not be deleted.

## Personal Data Deletion and Anonymization

- User deletion should anonymize direct personal identifiers where operational records must remain.
- Audit, ledger, proof, tracking, and dispute records may retain limited identifiers when required for legal defense, fraud prevention, accounting, or transport liability.
- GDPR delete/export workflows must separate erasable profile data from legally retained operational records.

## Finance and Ledger Boundaries

- Ledger entries, refunds, escrow releases, commissions, invoices, and payout records are immutable.
- Corrections must be posted as reversal/correction entries, never in-place edits.
- Retention target: 10 years or the applicable accounting/tax period for the operating jurisdiction.

## GDPR Export/Delete Readiness

- Export scope: profile, roles, sessions, customer/driver/merchant records, order history, shipment history, notifications, proof access logs, and audit references.
- Delete scope: inactive sessions, reset tokens, optional contact fields, and non-retained profile metadata.
- Blocked delete scope: active disputes, finance/ledger entries, proof/evidence under retention, audit/security events, and tracking history required for liability.

## Operational Controls

- Object storage lifecycle policies must be environment-specific and reviewed before production.
- Retention jobs must run through explicit queue workers only after deployment approval.
- No background deletion or anonymization loop is enabled in this build.
