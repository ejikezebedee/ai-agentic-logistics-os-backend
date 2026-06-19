# AI-Agentic Smart Logistics Operating System Backend

Industrial NestJS backend for logistics operations with strict role boundaries, state machines, AI governance, warehouse readiness, dispatch control, proof validation, escrow/ledger controls, immutable audit logs, and OpenAPI documentation.

## Stack

- NestJS + TypeScript
- PostgreSQL + Prisma
- Redis + BullMQ-ready queue layer
- JWT/refresh-token-ready auth foundation
- Swagger/OpenAPI
- S3-compatible object references for proof photos, signatures, and documents

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create local environment:

```bash
cp .env.example .env
```

3. Start PostgreSQL and Redis locally, then run:

```bash
npm run prisma:generate
npm run migrate:dev
npm run seed
npm run start:dev
```

4. Open Swagger:

```text
http://localhost:3000/docs
```

Default dev API base URL:

```text
http://localhost:3000
```

Exported OpenAPI contract:

```text
docs/openapi/openapi.json
```

Seed/dev login users all use this local-only password:

```text
ChangeMe-Local-Only-123!
```

Available seed users:

```text
superadmin@example.local
disponent@example.local
warehouse@example.local
driver@example.local
merchant@example.local
customer@example.local
finance@example.local
```

## Verification

```bash
npm test
npm run typecheck
npm run build
npm run openapi:export
npm run test:postgres
npm audit --audit-level=moderate
```

## Current Security Boundary

- API keys are encrypted before storage and never returned to frontend responses.
- Audit logs, tracking events, proof records, and ledger entries are treated as immutable.
- AI actions pass through risk classification, role permissions, and approval gates.
- L5 prohibited actions are blocked even with approvals.
- High-risk and critical actions require approval gates.
- Provider adapters are mock/dev only unless explicitly wired with approved live credentials.
- Queue behavior is mock enqueue-only by default; no production workers, orchestrator, autopilot, or idle loops are started by this backend.
- No live payment movement or live logistics provider calls are enabled in the committed dev configuration.

## Key Documents

- [Architecture](./docs/ARCHITECTURE.md)
- [Database Schema](./docs/DATABASE_SCHEMA.md)
- [State Machines](./docs/STATE_MACHINES.md)
- [AI Governance](./docs/AI_GOVERNANCE.md)
- [Codey Frontend API Contract](./docs/FRONTEND_API_CONTRACT.md)
- [Acceptance Report](./docs/ACCEPTANCE_REPORT.md)
- [Release Audit](./docs/RELEASE_AUDIT.md)
