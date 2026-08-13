# Nexus Pay — Demo Script

## Purpose

This is the structured script for the Nexus Pay hackathon demo. It covers what to say, what to show, what to type/speak to the agent, and what to expect at each step.

> **Important:** All transactions in this demo use **testnet USDC only**. No real funds are involved. Say this explicitly at the start. Do not claim simulated data is real.

**Estimated demo duration:** 8–12 minutes

---

## Pre-Demo Checklist

Before the demo, confirm:
- [ ] AWS backend is deployed and running (`npm run setup:backend` completed)
- [ ] Amplify frontend is accessible at the demo URL
- [ ] Admin credentials retrieved from Secrets Manager
- [ ] Coinbase CDP or Stripe/Privy credential provider configured in admin
- [ ] Payment Manager + Connector created
- [ ] User account created and signed in
- [ ] Payment Instrument created (wallet) and funded with testnet USDC
- [ ] Payment Session created (e.g., 5.00 USDC cap, 60 min)
- [ ] Seller configured (storefront + image-gen payout wallet)
- [ ] Storefront products seeded
- [ ] Browser DevTools closed (clean presentation)

---

## Demo Script

---

### Opening (30 seconds)

**Say:**

> "Nexus Pay is a permission layer for AI payments. The core question we're answering is: how do you give an AI agent the financial access it needs to be useful, without giving it unrestricted control over your money?
>
> Today's demo shows a working system where a user sets a spending cap, hands control to an AI agent, and the agent transacts autonomously within that cap — enforced by AWS AgentCore Payments, not by the application code."

---

### Step 1 — Show the User Dashboard (1 minute)

**Navigate to:** Instruments (Wallets) page — `/user`

**Say:**

> "This is the user dashboard. The user has connected a payment instrument — an embedded crypto wallet on Base Sepolia, provisioned through Coinbase CDP and managed by AWS AgentCore Payments. The private key is stored in AWS Secrets Manager. The agent never touches it."

**Show:** The wallet address and current USDC balance.

> "The wallet has testnet USDC, funded from the Circle Faucet on Base Sepolia. Nothing here is real money."

---

### Step 2 — Show the Active Session (1 minute)

**Navigate to:** Sessions page — `/user/sessions`

**Say:**

> "Before the agent can spend anything, the user creates a Payment Session. This is the control mechanism.
>
> This session has a maximum spend of five USDC and expires in one hour. The agent cannot spend more than this, and it cannot extend the session. These constraints are enforced by AgentCore Payments at the cloud level — not by our application code."

**Show:** The session's `maxSpendAmount`, expiry, and status.

---

### Step 3 — Open Agent Chat and Check Balance (2 minutes)

**Navigate to:** Agent Chat — `/user/agent`

**Say:**

> "Now we talk to the agent. The agent knows which wallet and session the user has active — it received this context when the WebSocket connected. Let's start simple."

**Type:**

```
How much USDC do I have in my wallet?
```

**Wait for response. Expected:** The agent calls `check_balance`, returns the real on-chain balance.

**Say:**

> "The agent called a tool that queried the actual on-chain balance using GetPaymentInstrumentBalance — this is a live number from the Base Sepolia blockchain, not a placeholder."

---

### Step 4 — Browse the Product Catalog (1 minute)

**Type:**

```
What's available in the storefront?
```

**Wait for response. Expected:** The agent calls `list_products` and returns a product list with prices.

**Say:**

> "The agent can browse an x402-gated storefront. These products are served by a seller Lambda on a separate API — no Cognito auth. The payment proof IS the authorization for that API."

---

### Step 5 — Execute an x402 Purchase (3 minutes)

**Type:**

```
Buy the cheapest product for me.
```

**Wait for response.**

**What happens behind the scenes (explain as it loads):**

> "The agent is calling the buy_product tool, which POSTs to the storefront. The storefront is returning HTTP 402 Payment Required with x402 payment requirements. The AgentCore Payments Plugin is intercepting that 402, calling ProcessPayment through AgentCore — that's the cloud-side payment signing. Once the signature is returned, the agent retries the original request with the payment proof in the X-PAYMENT header. The storefront verifies the proof with the x402 facilitator and confirms the order."

**Expected response:** Order confirmation with order ID, amount paid, product name.

**Say:**

> "One x402 transaction, zero manual approvals. The session cap was checked and enforced by AgentCore before the payment went through."

---

### Step 6 — Check Session Remaining Balance (30 seconds)

**Type:**

```
How much of my session budget is left?
```

**Expected:** Agent calls `check_balance` or reads from session context, reports remaining USDC.

---

### Step 7 — View Order History (1 minute)

**Navigate to:** Orders page — `/user/orders`

**Say:**

> "Everything the agent purchased is recorded here. The order came through the storefront's DynamoDB table, scoped to this user's Cognito sub. If it was a digital product, it also appears in the Library."

**Navigate to:** Library page — `/user/library` (if applicable)

---

### Step 8 (Optional — Voice Mode) (1.5 minutes)

**Return to Agent Chat. Toggle voice mode.**

**Say:**

> "The same agent runs in voice mode using Amazon Nova Sonic — bidirectional audio, speech-to-speech. Same payment tools, same session constraints, different modality."

**Speak:**

```
"What did I just buy?"
```

**Expected:** Voice response listing the recent purchase.

**Say:**

> "That's Nova Sonic — real-time speech processing. The agent remembered the prior purchase because of AgentCore Memory, which persists conversation context across turns."

---

### Step 9 (Optional — Cap Enforcement) (1 minute)

**Only do this if the session still has some budget and there's a product priced above the remaining amount.**

**Type:**

```
Buy [expensive product] for me.
```

**Expected:** Agent reports it cannot proceed because the session spending cap would be exceeded.

**Say:**

> "The agent correctly refused. That's the enforcement working — AgentCore Payments raised a ValidationException when we tried to exceed the session cap. No funds moved."

---

### Step 10 — Admin View (30 seconds)

**Sign in as admin. Navigate to Credential Providers.**

**Say:**

> "The admin view shows the credential providers, payment managers, and connectors. The admin configured the wallet infrastructure once. Users connect to it through instruments and sessions. The separation between admin configuration and user action is intentional — a regular user cannot modify the payment infrastructure."

---

### Closing (30 seconds)

**Say:**

> "That's Nexus Pay. An AI agent with financial autonomy — bounded by session-level spending caps enforced by AWS AgentCore, signed by keys it never holds, over a payment protocol it discovers automatically at runtime.
>
> The MVP demonstrates the core control model working end-to-end. The roadmap extends this to per-category policies, per-merchant restrictions, and daily aggregate limits — all built on the same session-permission foundation you just saw."

---

## What NOT to Say During the Demo

- ❌ Do not say "daily spending limit" as an existing feature — it is not yet implemented
- ❌ Do not say "per-category restrictions" as an existing feature — not yet implemented
- ❌ Do not say "manual approval workflows" as complete — not yet implemented
- ❌ Do not imply the transactions involve real money
- ❌ Do not show actual private keys, Secrets Manager values, or API keys on screen
- ❌ Do not call Nexus Pay an AWS reference implementation

---

## If Something Goes Wrong

| Problem | Response |
|---|---|
| Agent takes too long | "The agent is calling a tool — the x402 payment flow includes a retry with backoff for on-chain confirmation." |
| Balance shows 0 | "The wallet needs to be funded from the Circle Faucet — we can show that process." |
| Session expired | "Sessions are time-limited by design — create a new one from the Sessions page." |
| API error | "The backend is deployed on AWS — any transient errors reflect real distributed system behavior." |
| Voice mode not responding | "Voice mode requires the browser microphone — switch to text mode for the demo." |
| 402 payment fails | "If the x402 flow fails, it means the session cap was reached or the facilitator returned an error — both expected failure modes." |

---

## Demo Tips

- Have the storefront product list open in a second tab for quick reference
- Test the full flow (balance → list products → buy → check order) once before the live demo
- Keep the browser DevTools closed — don't show raw API responses unless asked
- If judges ask about future features, reference `docs/submission/future-scope.md` honestly
- Always frame unimplemented features as "on our roadmap" not "in the product"
