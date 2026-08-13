# Nexus Pay — Problem Statement

## The Problem: AI Agents Need Money, But Wallets Need Control

AI agents are moving from assistants to autonomous actors. They browse the web, interact with APIs, purchase services, and increasingly operate for extended periods without continuous human supervision.

This creates a real and immediate problem: **how do you give an AI agent the financial access it needs to be useful, without giving it unrestricted control over your money?**

---

## The Specific Gap

Today, there are two common approaches to AI + payments:

### Approach 1: Human-in-the-loop for every transaction
The agent asks for explicit approval before every payment.

**Problem:** This eliminates the autonomy that makes AI agents useful. If you have to approve every payment, you might as well make the payment yourself.

### Approach 2: Full wallet access
The agent has unrestricted access to a wallet.

**Problem:** The agent can spend more than intended, make payments to the wrong parties, be manipulated through adversarial prompts, or act on misunderstood instructions — with no enforcement mechanism to stop it.

---

## Why This Matters Now

The emergence of:
- **Autonomous AI agents** that run long multi-step tasks
- **x402 (HTTP 402 Payment Required)** — a protocol that allows API services to request payment automatically at the protocol level
- **Embedded crypto wallets** — infrastructure (Coinbase CDP, Stripe/Privy) that can provision programmable wallets
- **Agent payment infrastructure** (AWS AgentCore Payments) — cloud-native APIs to sign and process payments within agent runtimes

...means that AI agents can now autonomously discover, negotiate, and execute payments as part of their operation.

This is not theoretical. An AI agent browsing the internet can encounter an HTTP 402 response from any x402-enabled API and be expected to pay to continue. Without a control layer, the agent either cannot proceed (useless) or proceeds without any spending boundaries (dangerous).

---

## The Specific Harms Without a Control Layer

**Overspending:** An agent instructed to "buy whatever AI tools you need to complete this project" could spend far more than the user intended, with no mechanism to stop it before the funds are gone.

**Unpredictable accumulation:** Multiple agents, multiple sessions, multiple tasks — spending adds up across an ecosystem with no aggregate visibility.

**Prompt injection attacks:** An adversarial service could return a crafted 402 response that causes the agent to make a payment to an unintended destination.

**No audit trail at the session level:** Without scoped sessions, there is no way to retrospectively understand _what_ an agent was authorized to spend _when_.

**Trust deficit:** If users cannot control what an AI agent can spend, they will not give agents financial access — limiting the entire class of autonomous agentic applications.

---

## The Missing Primitive

What the emerging AI + Web3 payment ecosystem is missing is:

> **A programmable permission layer that sits between an AI agent and payment execution — enforcing constraints defined by the user, without requiring the user to approve every individual transaction.**

This layer needs to be:
- **Enforced in the cloud** (not just in software the agent controls)
- **Session-scoped** (time-bound, amount-capped)
- **Transparent** (the user can see what the agent did and why)
- **Non-custodial from the agent's perspective** (the agent does not hold private keys)

No such general-purpose layer exists as a standalone product today.

---

## The Opportunity

The x402 protocol and AWS AgentCore Payments create the right building blocks. What is missing is a **product layer** that:

1. Lets users define session-level spending constraints
2. Provisions controlled wallet instruments that the agent can use but not control
3. Intercepts x402 payment flows and validates them against the session constraints before execution
4. Gives users visibility into what the agent spent, on what, and when

**Nexus Pay is that product layer.**

It does not replace x402. It does not replace AgentCore. It uses both as infrastructure and adds the control and UX layer that makes autonomous AI payments safe for actual users.
