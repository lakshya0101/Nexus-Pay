# Nexus Pay — Solution

## What Nexus Pay Builds

Nexus Pay is a **permission and payment-control layer** between an autonomous AI agent and a user's funds. It combines AWS AgentCore Payments, the x402 payment protocol, and testnet USDC into a working system where an AI agent can make payments — but only within explicit, user-defined constraints.

---

## The Core Solution

### 1. Session-Scoped Spending Permissions

Before the agent can transact, the user creates a **Payment Session**:
- Sets a maximum spend amount (e.g., 5.00 USDC)
- Sets a session expiry window
- Links the session to a specific payment instrument

The session defines the financial envelope the agent is allowed to operate within. The agent cannot exceed the cap — AgentCore Payments enforces it cloud-side, not in software the agent controls.

### 2. Controlled Payment Instruments

Users connect **Payment Instruments** — embedded crypto wallets provisioned through Coinbase CDP or Stripe/Privy:
- The wallet is linked to the user's identity
- The agent can request payments through it but does not hold the private key
- Network-scoped: instruments are bound to EVM (Base Sepolia) or Solana Devnet

### 3. AI Agent That Understands and Executes Payments

The Nexus Pay agent (running on AWS AgentCore Runtime) is a Strands-based AI agent powered by Claude Sonnet 4.6. It:
- Understands natural language payment requests
- Uses payment tools to check balances, browse products, execute x402 payments, and review orders
- Operates within the payment context established by the user's active session and instrument
- Supports both text and voice interaction (Nova Sonic)

The agent has financial awareness but not financial freedom.

### 4. x402 Integration

When the agent calls a service that returns `HTTP 402 Payment Required`:

1. The `AgentCorePaymentsPlugin` intercepts the 402 response
2. Checks the payment requirements against the active session constraints
3. Calls AgentCore `ProcessPayment` (CRYPTO_X402) — cloud-side signature, no raw key exposure
4. Retries the original request with the signed payment proof
5. Service delivers the content

The user never approves individual transactions manually. The session-level constraint is the approval mechanism.

### 5. Visibility and Auditability

- All sessions and instruments are visible in the dashboard
- Order history shows what the agent purchased, when, and at what cost
- The library shows all acquired digital content
- CloudWatch vended log delivery captures Payment Manager transaction logs

---

## What Nexus Pay Does Not Claim

- **Does not claim to be a production payment system.** All transactions use testnet USDC on Base Sepolia or Solana Devnet.
- **Does not claim per-category or per-merchant rules are implemented.** The current control mechanism is session-level spending caps and expiry. These are the constraints enforced today.
- **Does not replace x402.** x402 is the payment protocol. Nexus Pay uses x402 as infrastructure and adds the permission layer around it.
- **Does not replace AWS AgentCore.** AgentCore is the runtime and payment infrastructure. Nexus Pay is the product layer on top.

---

## The Full User Journey

```
SETUP (one-time, admin)
1. Admin creates a Credential Provider (Coinbase CDP or Stripe/Privy)
2. Admin creates a Payment Manager + Connector
3. Admin configures the seller (storefront payout wallet)

SETUP (one-time, user)
4. User registers and signs in (Cognito)
5. User creates a Payment Instrument (embedded wallet, funded with testnet USDC)
6. User creates a Payment Session (e.g., 5 USDC cap, 60 min expiry)

USAGE (recurring)
7. User opens Agent Chat (text or voice)
8. User speaks/types: "What products are available?"
9. Agent calls list_products → returns catalog
10. User: "Buy the API Credit Pack"
11. Agent calls buy_product → Storefront returns HTTP 402
12. Plugin: validates against session cap → ProcessPayment → retry → order confirmed
13. User: "What did I just buy?" → Agent reads order history
14. User: "How much do I have left?" → Agent calls check_balance
15. Session expires or cap is reached → agent reports clearly
```

---

## Technical Differentiators

| What Nexus Pay Does | Why It Matters |
|---|---|
| Session-scoped spending caps enforced cloud-side | Cannot be bypassed by the agent or by prompt injection |
| Non-custodial signing (agent never holds raw keys) | Vendor secrets stay in Secrets Manager; agent only receives short-lived tokens |
| x402 automatic payment flow | No human approval needed per transaction within the session envelope |
| AgentCore Memory across sessions | Agent remembers prior orders, preferences, and conversation context |
| Voice + text interface | Natural interaction for agentic payment requests |
| Dual wallet provider support (CDP + Privy) | Flexibility; not locked to a single wallet vendor |
| Full order/library management | Payment is not just a transaction — it results in a deliverable the user can track and retrieve |

---

## MVP Scope

Nexus Pay for this hackathon is a working MVP demonstrating:
- The session-permission model
- The x402 agentic payment flow
- The AI agent with payment awareness
- The admin and user management interfaces
- Testnet USDC settlement on Base Sepolia

The MVP is intentionally scoped. It demonstrates the core control model working end-to-end on a real distributed system, not a simulation.
