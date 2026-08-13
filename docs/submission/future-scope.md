# Nexus Pay — Future Scope

## Where Nexus Pay Goes Next

Nexus Pay demonstrates the core session-permission model and x402 agentic payment flow as a working hackathon MVP. This document describes the natural evolution of the product from the current MVP into a production-grade agentic payment control platform.

These capabilities are **not yet implemented**. They are extensions of the architecture that is already in place.

---

## Tier 1: Immediate Extensions (Post-Hackathon)

These are direct extensions of the current implementation with low architectural complexity.

### 1. Daily Aggregate Spending Limits

**What:** Rolling 24-hour budget that accumulates across all sessions and instruments for a user.

**Why:** The current `maxSpendAmount` is per-session. A user could create multiple sessions within a day and spend beyond their intended daily limit by cycling through sessions.

**Implementation path:** Aggregate `ProcessPayment` events from CloudWatch vended logs or a DynamoDB counter table keyed by `(userId, date)`. Enforce at session creation time or at `ProcessPayment` time via a pre-check Lambda.

---

### 2. Per-Category Spending Policies

**What:** Allow users to restrict an agent session to specific spending categories — for example: "this session is for SaaS API credits only, not physical goods."

**Why:** Session caps control amount but not intent. Category restrictions add a semantic layer.

**Implementation path:** Storefront product catalog already has a `type` field. x402 payment-required headers can include a `description` field. A policy engine running between the payment plugin and `ProcessPayment` could validate the payment intent against a user-defined category allowlist.

---

### 3. Per-Merchant Restrictions

**What:** Allowlist or denylist specific merchants, API endpoints, or smart contract addresses.

**Why:** A session cap prevents overspending but does not prevent payments to wrong parties. Merchant restrictions add destination-level control.

**Implementation path:** Maintain a per-user merchant policy list (DynamoDB). Validate the `payTo` address from the x402 payment-required header against the policy before calling `ProcessPayment`.

---

### 4. Manual Approval Workflows for High-Value Transactions

**What:** Transactions above a configurable threshold are paused and a notification is sent to the user for explicit approval before the payment proceeds.

**Why:** Some payments should require a human in the loop — not every transaction, but those above a risk threshold.

**Implementation path:** Intercept at the payment plugin layer. If `amount > approvalThreshold`, write a pending approval record to DynamoDB, send an SNS/SES notification, and wait for the user to approve via the frontend before calling `ProcessPayment`.

---

## Tier 2: Product Expansion

### 5. Production USDC Settlement

**What:** Move from testnet (Base Sepolia, Solana Devnet) to mainnet USDC.

**Why:** Real financial utility.

**Dependencies:** Production wallet provider accounts, mainnet x402 facilitator, regulatory and compliance review, security audit.

---

### 6. Multi-Asset Support

**What:** Support additional stablecoins and ERC-20 tokens beyond USDC.

**Why:** Users may have assets in other tokens. x402 supports multiple payment options in a single 402 response.

**Implementation path:** Extend `_pick_accept()` in `tools.py` to negotiate asset selection based on user instrument balances. Add token configurations to `.env`.

---

### 7. Multi-Network Expansion

**What:** Mainnet Base, Ethereum, Polygon, other EVM chains, Solana mainnet.

**Why:** Broader network coverage for a larger set of x402-enabled services.

---

### 8. Advanced Audit and Compliance Logs

**What:** Per-payment policy evaluation trace — what rule was applied, what was the pre-payment balance, what was the approval decision, and what was the post-payment state.

**Why:** Enterprise and regulated contexts require complete audit trails, not just transaction records.

**Implementation path:** Extend the vended log delivery pipeline; add a structured event schema for policy evaluations.

---

## Tier 3: Ecosystem Expansion

### 9. Multi-Agent Payment Orchestration

**What:** Shared payment budgets across teams of AI agents, with spend isolation per agent.

**Why:** Complex agentic workflows involve multiple specialized agents. A shared budget pool with per-agent sub-limits enables team-level financial governance.

**Implementation path:** AgentCore Payments sessions can be scoped to workload identities. Each sub-agent operates on its own session within a shared manager-level budget.

---

### 10. Merchant SDK and x402 Integration Toolkit

**What:** A documented SDK for sellers and API providers to add x402 payment requirements to their services, compatible with the Nexus Pay agent.

**Why:** The current x402 seller endpoints (image-gen, storefront) demonstrate the pattern. A reusable SDK would expand the ecosystem of services the Nexus Pay agent can pay for.

---

### 11. Agent Identity and Trust Credentials

**What:** Cryptographic agent identity certificates so x402 sellers can verify which specific agent is making a payment request — not just that a valid payment proof was submitted.

**Why:** As the x402 ecosystem grows, sellers will want to know _which_ agent is paying, not just _that_ payment was made. Agent identity enables reputation systems, tiered access, and agent-specific pricing.

**Implementation path:** Build on AgentCore Workload Identity (already used for token exchange) to issue verifiable agent credentials.

---

### 12. Spending Analytics Dashboard

**What:** A rich analytics view showing spending trends, agent activity patterns, category breakdowns, and budget utilization rates.

**Why:** Users need visibility into how their agents are spending over time to calibrate session limits and make informed decisions.

**Implementation path:** Read from CloudWatch vended logs and DynamoDB order history. Visualize with Recharts (already in the frontend dependency tree).

---

### 13. Cross-Platform Agent Integration

**What:** SDKs or connectors that allow non-Nexus-Pay AI agents (e.g., AutoGPT, LangChain, CrewAI) to use Nexus Pay session credentials for x402 payments.

**Why:** Nexus Pay's session-permission model should be accessible to any AI agent, not just the one built into this platform.

---

## Tier 4: Production Hardening

### 14. Security Audit

- Formal security audit of the payment signing flow
- Penetration testing of x402 payment verification
- Smart contract security review for on-chain settlement

### 15. IAM Hardening

- Replace wildcard `bedrock-agentcore:*` permissions with explicit action sets
- Scope all S3 permissions to specific bucket ARNs
- Tighten CORS: replace wildcard `allowOrigins: ["*"]` with specific frontend domain

### 16. DynamoDB Production Configuration

- Change `removalPolicy: DESTROY` to `RETAIN` for production tables
- Enable DynamoDB PITR backups (already enabled in current config)
- Add TTL on order records older than configurable retention period

### 17. Multi-Region Architecture

- Deploy the CDK stack to multiple regions for availability
- AgentCore Runtime cross-region failover
- DynamoDB Global Tables for cross-region data replication

---

## Architecture Evolution Path

```
Current MVP
    │
    │  Session-level caps
    │  x402 flow
    │  Text + voice agent
    │  Testnet USDC
    │
    ▼
Phase 2: Enhanced Controls
    │
    │  + Daily aggregate limits
    │  + Per-category policies
    │  + Per-merchant restrictions
    │  + Manual approval workflows
    │
    ▼
Phase 3: Production
    │
    │  + Mainnet USDC settlement
    │  + Multi-asset / multi-network
    │  + Multi-agent orchestration
    │  + Advanced audit logs
    │
    ▼
Phase 4: Ecosystem
    │
    │  + Merchant SDK
    │  + Agent identity credentials
    │  + Analytics dashboard
    │  + Cross-platform agent connectors
    │
    ▼
Production Platform
    │
    │  + Full production hardening
    │  + Security audit
    │  + IAM hardening
    │  + Multi-region deployment
```

---

## The Core Thesis Remains Constant

At every stage of the roadmap, the Nexus Pay thesis does not change:

> **AI agents should have controlled financial autonomy — not unlimited wallet access, and not per-transaction human approval.**

The MVP demonstrates this thesis is technically achievable today. The roadmap makes it progressively more capable, more granular, and eventually production-ready.
