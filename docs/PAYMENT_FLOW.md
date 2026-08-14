# Nexus Pay — Payment Flow

## Two Modes
Nexus Pay has a clear distinction between:

- **Local Demo Mode:** simulated payment progression; no real funds are transferred.
- **AWS-connected mode:** uses deployed payment infrastructure and AgentCore Payments.

## Conceptual Flow

```text
Payment Intent
    ↓
Nexus Pay
    ↓
AI Agent
    ↓
Payment Session / Allowance Context
    ↓
Payment Infrastructure
    ↓
x402
    ↓
Settlement
    ↓
Result / History
```

## Connected Agentic Payment
1. User provides a payment-related intent.
2. Frontend sends the request through the agent connection.
3. Payment agent interprets the request.
4. Required tool is selected.
5. Payment instrument/session context is used.
6. AgentCore Payments can process the payment when configured.
7. An x402 merchant can return HTTP `402 Payment Required`.
8. Payment authorization/proof is obtained.
9. Merchant request is retried with payment proof.
10. Result is returned.

## x402 Loop

```text
Agent → Merchant
       ← HTTP 402 Payment Required
Agent → ProcessPayment
       → Payment Proof
       → Merchant Retry
       ← Resource / Settlement Result
```

## Local `/user/pay`
The current local Pay page is a demonstration flow. It validates the UI progression and stores a simulated transaction in local Zustand state. It does not dispatch a real browser-side on-chain transfer.

Use the wording:

> Demo Payment Simulated — no real funds were transferred.

## Real Settlement
Real x402 settlement requires the deployed AWS payment infrastructure, valid payment instruments/credentials and the relevant blockchain/facilitator configuration.
