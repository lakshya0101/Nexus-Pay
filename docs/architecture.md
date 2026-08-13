# Nexus Pay — Architecture Documentation

## Overview

Nexus Pay is an AI-powered Web3 payment platform built on top of AWS AgentCore, the x402 payment protocol, and testnet USDC. The central design goal is a **permission and control layer** between an autonomous AI agent and a user's funds.

This document describes the actual deployed architecture derived from the repository. All components described here are present in the codebase.

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER (Browser)                               │
└────────────────────────────┬────────────────────────────────────────┘
                             │  HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    NEXUS PAY FRONTEND                                │
│          React 19 + Vite 7 + TailwindCSS 4                          │
│                                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │  Admin UI   │  │   User UI    │  │   Agent Chat (WebSocket) │   │
│  │  Managers   │  │  Instruments │  │   Text + Voice streaming  │   │
│  │  Connectors │  │  Sessions    │  │                          │   │
│  │  Sellers    │  │  Orders      │  └──────────────────────────┘   │
│  └─────────────┘  └──────────────┘                                  │
│                                                                      │
│  Auth: Amazon Cognito (SRP)   State: Zustand   Routing: React Router│
└────────────────────────────┬────────────────────────────────────────┘
                             │  Bearer JWT (Cognito ID Token)
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│              AMAZON API GATEWAY (HTTP API v2)                        │
│                  Cognito JWT Authorizer                               │
│                                                                      │
│  /admin/credential-providers    /user/instruments                    │
│  /admin/managers                /user/sessions                       │
│  /admin/connectors              /user/payment-options                │
│  /admin/storefront/*            /user/agent/ws-url                  │
│                                 /user/agent/invoke                   │
└──────┬──────────────────────────────┬───────────────────────────────┘
       │                              │
       ▼                              ▼
┌──────────────────┐      ┌───────────────────────────────────────────┐
│  ADMIN LAMBDAS   │      │              USER LAMBDAS                  │
│  Python 3.13     │      │              Python 3.13                   │
│                  │      │                                           │
│  credential_     │      │  instruments → Create/List/Get/Delete     │
│  providers       │      │               + GetBalance                │
│                  │      │                                           │
│  payment_        │      │  sessions    → Create/List/Get/Delete     │
│  managers        │      │                                           │
│                  │      │  payment_    → Read-only manager+connector │
│  payment_        │      │  options       bootstrap for new users    │
│  connectors      │      │                                           │
│                  │      │  agent (ws)  → Returns presigned WebSocket │
└──────┬───────────┘      │               URL to AgentCore Runtime    │
       │                  └───────────────────────┬───────────────────┘
       │                                          │
       ▼                                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│              AWS AGENTCORE — CONTROL PLANE                           │
│                                                                      │
│  PaymentCredentialProvider   (stores vendor secrets in Secrets Mgr) │
│  PaymentManager              (manages agent payment authority)       │
│  PaymentConnector            (links manager ↔ credential provider)  │
└─────────────────────────────────────────────────────────────────────┘

                     User connects via WebSocket
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│              AWS AGENTCORE RUNTIME                                   │
│              FastAPI container (ARM64, port 8080)                    │
│              Built by CodeBuild → stored in ECR                      │
│                                                                      │
│  Endpoints:                                                          │
│    GET  /ping, /health      — Runtime health checks                  │
│    POST /invocations        — REST text fallback                     │
│    WS   /ws                 — WebSocket: text + voice streaming       │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                  STRANDS AI AGENT                             │   │
│  │                                                              │   │
│  │  Text Mode: Claude Sonnet 4.6                                │   │
│  │    - stream_async (native async streaming)                   │   │
│  │    - AgentCoreMemorySessionManager (per-connection memory)   │   │
│  │    - AgentCorePaymentsPlugin (primary x402 handler)          │   │
│  │                                                              │   │
│  │  Voice Mode: BidiAgent + Nova Sonic                          │   │
│  │    - BidiNovaSonicModel (speech-to-speech)                   │   │
│  │    - PCM audio in → audio out over WebSocket                 │   │
│  │    - In-process x402 fallback (no plugin in BidiAgent)       │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    PAYMENT TOOLS (6)                          │   │
│  │                                                              │   │
│  │  check_balance    → GetPaymentInstrumentBalance (free)       │   │
│  │  generate_image   → Nova Canvas seller endpoint (0.04 USDC) │   │
│  │  list_products    → Storefront catalog (free)                │   │
│  │  buy_product      → Storefront /orders (x402 paid)           │   │
│  │  list_orders      → Buyer order history (free)               │   │
│  │  cancel_order     → Seller-originated refund                 │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│         PAYMENT SESSION / SPENDING CONTROL LAYER                     │
│                                                                      │
│  PaymentSession.limits.maxSpendAmount  — hard session spending cap  │
│  PaymentSession.expiryTimeInMinutes    — session time window        │
│  PaymentInstrument.network             — ETHEREUM or SOLANA         │
│                                                                      │
│  Enforcement: AgentCore cloud-side (ValidationException on cap      │
│  breach — no funds move even if agent attempts to overspend)        │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│         AWS AGENTCORE PAYMENTS — DATA PLANE                          │
│                                                                      │
│  ProcessPayment (CRYPTO_X402)                                        │
│  GetPaymentInstrumentBalance                                         │
│  CreatePaymentInstrument / CreatePaymentSession                      │
│  GetPaymentSession / DeletePaymentSession                            │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       x402 PROTOCOL                                  │
│                                                                      │
│  1. Tool calls seller service endpoint                               │
│  2. Seller returns HTTP 402 with payment-required header (base64)   │
│  3. AgentCore Payments Plugin parses x402 requirements              │
│  4. ProcessPayment called (CRYPTO_X402 type, tagged with agentName) │
│  5. Returns signed payment proof                                     │
│  6. Tool retries with X-PAYMENT header                              │
│  7. Seller verifies signature → delivers content                     │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    TESTNET USDC SETTLEMENT                           │
│                                                                      │
│    Base Sepolia (EVM)               Solana Devnet                    │
│    USDC: 0x036CbD53...             USDC Mint: 4zMMC9srt5Ri5X...     │
│    x402 Facilitator: x402.org/facilitator                           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Deep Dive

### 1. Frontend

**Technology:** React 19, Vite 7, TailwindCSS 4, Radix UI, Zustand 5

The frontend has two distinct user roles, separated by Cognito group membership:

**Admin role** (`/admin/*`):
- Manage Credential Providers (Coinbase CDP, Stripe/Privy)
- Manage Payment Managers and Connectors
- Configure the seller (storefront + image-gen payout wallet)
- View seller orders

**User role** (`/user/*`):
- Manage Payment Instruments (wallets)
- Manage Payment Sessions (spending caps + expiry)
- Interact with the AI payment agent (text + voice)
- View digital content library and order history

**WebSocket Protocol (AgentChat):**
1. Frontend fetches a presigned WebSocket URL from `/user/agent/ws-url`
2. Opens WebSocket to AgentCore Runtime
3. Sends `{type: "init", userId, mode, instrumentId, managerArn, sessionId, network, walletAddress}`
4. Receives streaming events: `text_stream`, `text_done`, `tool_use`, `media`, `status`

**State Management (Zustand):**
- `AdminStore` — credential providers, managers, connectors (cleared on sign-out)
- `UserStore` — instruments, sessions, transactions
- `ChatStore` — agent messages, WebSocket status, voice mode toggle

---

### 2. API Gateway + Lambda Backend

**API Gateway:** HTTP API v2 with a Cognito JWT authorizer on all routes.

**Admin Lambdas** (role: `admin`) call AgentCore Payments **control-plane** APIs:
- `CreatePaymentCredentialProvider` / `ListPaymentCredentialProviders` / ...
- `CreatePaymentManager` / `ListPaymentManagers` / ...
- `CreatePaymentConnector` / `ListPaymentConnectors` / ...

**User Lambdas** (role: `user`) call AgentCore Payments **data-plane** APIs:
- `CreatePaymentInstrument` — provisions an embedded crypto wallet
- `GetPaymentInstrument` — retrieves wallet address and details
- `GetPaymentInstrumentBalance` — real-time USDC balance
- `CreatePaymentSession` — creates a capped spending session
- `ListPaymentSessions` / `GetPaymentSession` / `DeletePaymentSession`

**Agent WebSocket Lambda:**
- Calls `InvokeAgentRuntimeWithWebsocketStream` on AgentCore Runtime
- Returns a presigned WebSocket URL directly to the frontend — the browser connects directly to the Runtime container

**Seller Lambdas** (no Cognito — x402 payment IS the authorization):
- `image-gen` (Node.js 22): Validates x402 payment proof via x402.org/facilitator, then calls Nova Canvas
- `storefront` (Node.js 22): Product catalog, x402 order endpoint, refund flow, DynamoDB state

---

### 3. AgentCore Runtime (AI Agent)

**Container:** ARM64 Docker image built by CodeBuild, stored in ECR, deployed to AgentCore Runtime.

**Server:** FastAPI + uvicorn on port 8080, with CORS enabled.

**Text Mode (`/ws`, mode=text):**
- Strands `Agent` with `BedrockModel` (Claude Sonnet 4.6)
- `AgentCoreMemorySessionManager` — fresh session per connection, persistent across turns
- `AgentCorePaymentsPlugin` — intercepts HTTP 402 responses, runs tagged `ProcessPayment`, re-invokes tool
- `stream_async` — native async streaming of text events to the frontend

**Voice Mode (`/ws`, mode=voice):**
- `BidiAgent` + `BidiNovaSonicModel` (Nova Sonic, `amazon.nova-2-sonic-v1:0`)
- Receives binary PCM audio (16kHz mono 16-bit), streams back binary PCM audio
- In-process x402 fallback (BidiAgent does not support the Payments Plugin)
- `AgentCoreMemorySessionManager` also attached in voice mode

**REST Mode (`/invocations`):**
- Synchronous text conversation via `converse_text()`
- Same payment context model as WebSocket init frame

**Payment Context Threading:**
The frontend passes the complete payment context through the WebSocket init frame:
- `managerArn` — identifies the Payment Manager
- `instrumentId` — the user's wallet instrument
- `sessionId` — the active spending session
- `connectorId` — wallet provider connector
- `walletAddress` — user's wallet address
- `network` — `ETHEREUM` (Base Sepolia) or `SOLANA` (Devnet)

No database lookups are needed — the agent has full context from the init frame.

---

### 4. Payment Tools

Six Strands `@tool`-decorated Python functions in `tools.py`:

| Tool | Payment | Mechanism |
|---|---|---|
| `check_balance` | Free | `GetPaymentInstrumentBalance` boto3 call |
| `generate_image` | 0.04 USDC | POST to image-gen seller → x402 → Nova Canvas |
| `list_products` | Free | GET to storefront /products |
| `buy_product` | Product price in USDC | POST to storefront /orders → x402 → fulfillment |
| `list_orders` | Free | GET to storefront /orders?userId=... |
| `cancel_order` | Seller-refund | POST to storefront /orders/{id}/refund |

**x402 Plugin Path (primary, text mode):**
1. Tool makes initial HTTP call
2. On 402: returns `PAYMENT_REQUIRED: {...}` marker string
3. Plugin intercepts, runs tagged `ProcessPayment` (populates observability dashboard)
4. Plugin re-invokes tool with `PAYMENT-SIGNATURE` header
5. Tool forwards signed header to seller → 200 response

**In-process Fallback (voice mode / plugin disabled):**
1. Tool calls `_pay_and_retry(url, ...)`
2. On 402: parse requirements → `ProcessPayment` → build `X-PAYMENT` header → retry with backoff (2, 3, 5, 8, 10s)

---

### 5. Payment Session / Spending Control Layer

This is the core of Nexus Pay's value proposition. Currently implemented:

**`PaymentSession.limits.maxSpendAmount`**
- Set by the user when creating a session
- Enforced **cloud-side** by AgentCore Payments — the agent cannot override it
- If a `ProcessPayment` call would push the session over the cap, AgentCore returns a `ValidationException`
- The agent surfaces a friendly error message rather than silently failing or proceeding

**`PaymentSession.expiryTimeInMinutes`**
- Sessions expire automatically — the agent cannot transact on an expired session
- Error surfaced as: "Your payment session has expired. Create a new session."

**`PaymentInstrument.network`**
- Instrument is bound to a specific network (EVM or Solana)
- x402 `_pick_accept()` matches the seller's payment options to the instrument's network

**Planned extensions** (not yet implemented — see `docs/submission/future-scope.md`):
- Per-category policies
- Per-merchant restrictions
- Daily aggregate limits

---

### 6. Infrastructure

**AWS CDK Stack (`PaymentAgentStack`):**

| Resource | Name | Purpose |
|---|---|---|
| Cognito UserPool | `agentcore-payments-users` | Auth + role groups |
| HTTP API | `agentcore-payments-api` | Main API (Cognito-authed) |
| HTTP API | `x402-sellers-api` | Seller endpoints (x402-authed) |
| ECR Repository | `agentcore-payments-agent` | Agent container images |
| CodeBuild Project | `agentcore-payments-agent-build` | ARM64 Docker image build |
| AgentCore Runtime | `agentcore_payments_runtime` | Runs the AI agent container |
| AgentCore Memory | `agentcore_payments_memory` | Persistent conversation memory |
| DynamoDB | `StorefrontProducts` | Product catalog |
| DynamoDB | `StorefrontOrders` | Order records (GSI on buyerUserId) |
| DynamoDB | `StorefrontSellerConfig` | Seller payout wallet config |
| S3 | `agentcore-payments-media-*` | Presigned image URLs (1-day expiry) |
| S3 | Library bucket | Per-buyer digital content library |
| S3 | Assets bucket | Seller deliverable files |
| Secrets Manager | `DemoAdminCredentials` | Auto-generated admin password |

**IAM Roles (least-privilege per component):**
- `AgentCorePayments-AdminCP` — control-plane CRUD only
- `AgentCorePayments-UserDP` — data-plane: instruments, sessions, process payment
- `AgentCorePayments-UserPaymentOptions` — read-only: list managers + connectors
- `AgentCorePayments-ManagerRole` — assumed by AgentCore for payment execution
- `AgentCorePayments-AgentExecution` — assumed by AgentCore Runtime container

---

### 7. Observability

Two observability layers are active:

**ADOT Auto-Instrumentation:**
- OpenTelemetry Python distro configured at agent startup
- Exports traces via OTLP to the AgentCore Runtime collector
- `OTEL_SERVICE_NAME=agentcore-payments-agent`

**AgentCore Payments Vended Log Delivery:**
- On first invocation, the agent wires `put_delivery_source` / `put_delivery_destination` / `create_delivery`
- Payment Manager transaction logs flow to CloudWatch Logs at `/bedrock-agentcore/payments/<managerId>`
- `ENABLE_VENDED_LOG_DELIVERY=1` (configurable)

**Payments Observability Dashboard:**
- Every `ProcessPayment` call is tagged with `agentName=agentcore-payments-agent`
- Populates the AgentCore Payments dashboard counters: Agents, Managers, Connectors

---

## Data Flow: End-to-End Purchase

```
1. User types: "Buy the eBook about agentic commerce"
                          │
2. AgentChat WebSocket   │  {type: "text", content: "Buy the eBook..."}
                          │
3. Strands Agent receives message
   - Decides to call list_products to find the eBook
   - Calls buy_product with found product ID
                          │
4. buy_product → POST storefront/orders
   - Storefront checks: no X-PAYMENT header
   - Returns HTTP 402 with payment-required header (base64 x402 requirements)
                          │
5. AgentCorePaymentsPlugin intercepts PAYMENT_REQUIRED marker
   - Parses x402 requirements (amount, network, payTo address)
   - Calls ProcessPayment(CRYPTO_X402, sessionId, instrumentId, managerArn)
                          │
6. AgentCore Payments Data Plane:
   - Checks: amount ≤ session maxSpendAmount remaining?
   - YES → signs on-chain USDC transfer on Base Sepolia
   - Returns signed payment proof
                          │
7. Plugin re-invokes buy_product with PAYMENT-SIGNATURE header
   buy_product → POST storefront/orders (with payment proof)
                          │
8. Storefront verifies proof with x402 facilitator
   - Confirms on-chain settlement
   - Creates order record in DynamoDB
   - Saves deliverable to library S3 bucket (keyed by Cognito sub)
   - Returns order confirmation
                          │
9. Agent streams result to frontend:
   {type: "text_done", content: "Your eBook has been purchased and is available in your Library."}
```

---

## Security Model

| Concern | Mechanism |
|---|---|
| Auth | Cognito SRP + JWT, group-based role enforcement per route |
| Credential storage | AWS Secrets Manager + KMS — agent never sees raw keys |
| Spending control | AgentCore cloud-side enforcement — cannot be bypassed by agent |
| Wallet signing | Short-lived vendor tokens at signing time only |
| S3 data | All buckets block public access, enforce SSL, server-side encryption |
| Secrets in code | None — `.env` is gitignored, Secrets Manager for all credentials |
| Admin isolation | Admin store cleared on sign-out — no data leakage between sessions |

---

## What Nexus Pay Is Not

- **Not an AWS reference project** — it is a product built on top of AWS infrastructure
- **Not a replacement for x402** — x402 is the payment protocol Nexus Pay uses
- **Not a replacement for AgentCore** — AgentCore is the underlying runtime and payment infrastructure
- **Not a production payment system** — current implementation uses testnet USDC only
