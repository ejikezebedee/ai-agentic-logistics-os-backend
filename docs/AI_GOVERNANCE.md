# AI Governance

## Operating Model

AI recommendation -> rules validation -> permission check -> risk classification -> human approval gate when required -> execution -> immutable audit log.

AI is not an unrestricted actor. It cannot bypass RBAC, ABAC-ready policy checks, approval gates, ledger immutability, proof rules, or audit requirements.

## Agents

- AI Logistics Orchestrator
- AI Order Agent
- AI Pricing Agent
- AI Warehouse Agent
- AI Disponent Agent
- AI Dispatch Agent
- AI Route Agent
- AI Tracking Agent
- AI Exception Agent
- AI Finance Agent
- AI Dispute Agent
- AI Compliance Agent
- AI Support Agent
- AI Analytics Agent

## Provider System

Supported provider configuration:

- OpenAI
- DeepSeek
- Anthropic
- Google Gemini
- Mistral
- Groq
- Ollama/local model
- Custom OpenAI-compatible endpoint

Provider API keys are encrypted at rest and never returned to frontend responses. AI calls are modeled for provider, model, user, task, cost estimate, token usage, latency, result, and fallback behavior.

## Risk Levels

- L1 Low Risk: can execute automatically.
- L2 Medium Risk: can execute automatically only if policy allows; otherwise Disponent approval.
- L3 High Risk: requires human approval.
- L4 Critical: requires dual approval from correct roles.
- L5 Prohibited: always blocked.

## Prohibited Actions

AI must never delete audit logs, delete evidence, alter ledger history, bypass approval gates, bypass permissions, or execute finance/compliance actions above its risk allowance.
