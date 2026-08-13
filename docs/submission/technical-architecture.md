# Nexus Pay — Technical Architecture

## System Overview

Nexus Pay is built on a cloud-native, serverless-first architecture deployed entirely on AWS. The system consists of four major layers: a React frontend, a serverless API backend, an AI agent runtime, and a payment data plane.

All components described here are implemented and present in the repository.

---

## Layer 1: Frontend

**Technology:** React 19, Vite 7, TailwindCSS 4, Radix UI, Zustand 5, React Router DOM 7

**Hosted on:** AWS Amplify (static SPA deployment)

**Auth:** Amazon Cognito via `amazon-cognito-identity-js` (SRP authentication)

**Structure:**
```
frontend/src/
├── pages/
│   ├── Login.tsx                      # Auth: sign in, sign up, confirm
│   ├── admin/
│   │   ├── Overview.tsx               # Admin dashboard
│   │   ├── CredentialProviders.tsx    # Manage CDP/Privy credentials
│   │   ├── PaymentManagers.tsx        # Create/manage payment managers
│   │   ├── PaymentConnectors.tsx      # Link managers to providers
│   │   ├── SellerSetup.tsx            # Configure seller payout wallet
│   │   └── SellerOrders.tsx           # View seller order history
│   └── user/
│       ├── Instruments.tsx            # Wallet management
│       ├── Sessions.tsx               # Spending session management
│       ├── AgentChat.tsx              # AI agent: text + voice
│       ├── Library.tsx                # Purchased digital content
│       └── Orders.tsx                 # Order history
├── lib/
│   ├── api.ts                         # API Gateway client (injects Cognito JWT)
│   ├── auth.ts                        # Cognito auth helpers
│   └── balance.ts                     # Balance resolution (network → RPC)
└── store/
    ├── auth.ts                        # Authentication state
    ├── admin.ts                       # Credential providers, managers, connectors
    └── user.ts                        # Instruments, sessions
```

**Role-based access:**
- `admin` group (Cognito) → sees admin routes only
- `user` group (Cognito) → sees user routes only
- New self-sign-up accounts are auto-assigned to `user` group via PostConfirmation Lambda trigger

**WebSocket protocol:**
1. Frontend fetches presigned WebSocket URL from `/user/agent/ws-url`
2. Opens WebSocket to AgentCore Runtime
3. Sends init frame: `{userId, mode, instrumentId, managerArn, sessionId, connectorId, network, walletAddress}`
4. Receives events: `{type: "status"}`, `{type: "text_stream"}`, `{type: "text_done"}`, `{type: "tool_use"}`, `{type: "media"}`, `{type: "response_done"}`
5. Can send mid-connection `{type: "context_update"}` to switch instruments/sessions

---

## Layer 2: API Backend

**Technology:** AWS Lambda (Python 3.13, Node.js 22 ARM64), Amazon API Gateway HTTP v2

**CDK Stack:** `PaymentAgentStack` in `backend/lib/payment-agent-stack.ts`

### Main API (Cognito-authenticated)

**URL:** `https://<api-id>.execute-api.<region>.amazonaws.com`

| Route | Lambda | IAM Role | Calls |
|---|---|---|---|
| `GET/POST /admin/credential-providers` | `credential_providers` | AdminCP | AgentCore CreatePaymentCredentialProvider etc. |
| `GET/PUT/DELETE /admin/credential-providers/{id}` | `credential_providers` | AdminCP | AgentCore Get/Update/DeletePaymentCredentialProvider |
| `GET/POST /admin/managers` | `payment_managers` | AdminCP | AgentCore CreatePaymentManager etc. |
| `GET/PUT/DELETE /admin/managers/{id}` | `payment_managers` | AdminCP | AgentCore Get/Update/DeletePaymentManager |
| `GET/POST /admin/connectors` | `payment_connectors` | AdminCP | AgentCore CreatePaymentConnector etc. |
| `GET/PUT/DELETE /admin/connectors/{id}` | `payment_connectors` | AdminCP | AgentCore Get/Update/DeletePaymentConnector |
| `GET/POST /user/instruments` | `instruments` | UserDP | AgentCore CreatePaymentInstrument, ListPaymentInstruments |
| `GET/DELETE /user/instruments/{id}` | `instruments` | UserDP | AgentCore GetPaymentInstrument, DeletePaymentInstrument |
| `GET /user/instruments/{id}/balance` | `instruments` | UserDP | AgentCore GetPaymentInstrumentBalance |
| `GET/POST /user/sessions` | `sessions` | UserDP | AgentCore CreatePaymentSession, ListPaymentSessions |
| `GET/DELETE /user/sessions/{id}` | `sessions` | UserDP | AgentCore GetPaymentSession, DeletePaymentSession |
| `GET /user/payment-options` | `payment_options` | PaymentOptions (read-only) | AgentCore ListPaymentManagers, ListPaymentConnectors |
| `GET /user/agent/ws-url` | `agent (ws)` | UserDP | AgentCore InvokeAgentRuntimeWithWebsocketStream |
| `POST /user/agent/invoke` | `agent (ws)` | UserDP | AgentCore InvokeAgentRuntime |

### Seller API (x402-authenticated, no Cognito)

**URL:** `https://<seller-api-id>.execute-api.<region>.amazonaws.com`

| Route | Lambda | Mechanism |
|---|---|---|
| `POST /image-gen` | `image-gen` (Node.js 22) | Validates X-PAYMENT proof, calls Nova Canvas, returns signed URL |
| `GET /image-gen` | `image-gen` | Health/discovery |
| `GET/POST /products` | `storefront` (Node.js 22) | Product catalog, DynamoDB |
| `POST /orders` | `storefront` | x402 payment validation → order creation → digital delivery |
| `GET /orders` | `storefront` | Buyer order history (scoped by userId query param) |
| `POST /orders/{id}/refund` | `storefront` | Seller-originated refund |
| `GET /library` | `storefront` | Buyer digital content library (S3 presigned URLs) |

### Shared Lambda Layer

All Python lambdas use a shared layer (`lambdas/shared/`) containing:
- `agentcore_client.py` — boto3 wrapper for AgentCore Payments APIs
- `response.py` — standard HTTP response builder
- Pinned `boto3` and `botocore` (AgentCore preview APIs require a newer version than the Lambda runtime default)

---

## Layer 3: AI Agent Runtime

**Technology:** FastAPI (Python), uvicorn, Strands Agent framework, AWS AgentCore Runtime

**Container:** ARM64 Docker image, built by CodeBuild, stored in ECR, deployed to AgentCore Runtime

**Endpoint registered with Runtime:** Port 8080 (HTTP)

### Agent Entry Points

| Endpoint | Type | Mode |
|---|---|---|
| `GET /ping` | REST | Health check |
| `GET /health` | REST | Health check |
| `POST /invocations` | REST | Synchronous text conversation |
| `WS /ws` | WebSocket | Streaming text + voice |

### Text Mode (Strands Agent + Claude Sonnet 4.6)

```python
Agent(
    model=BedrockModel(model_id="us.anthropic.claude-sonnet-4-6"),
    tools=STRANDS_TOOLS,
    system_prompt=build_system_prompt(payment_context),
    callback_handler=...,
    session_manager=AgentCoreMemorySessionManager(
        agentcore_memory_config=AgentCoreMemoryConfig(
            memory_id=MEMORY_ID,
            session_id=f"{user_id}-{uuid4().hex[:8]}",
            actor_id=user_id,
        )
    ),
)
```

`AgentCorePaymentsPlugin` is added to the agent for the primary x402 path:
- Tags every `ProcessPayment` with `agentName=agentcore-payments-agent`
- Populates the AgentCore Payments observability dashboard
- Intercepts `PAYMENT_REQUIRED:` tool return markers and re-invokes the tool post-payment

### Voice Mode (BidiAgent + Nova Sonic)

```python
BidiAgent(
    model=BidiNovaSonicModel(model_id="amazon.nova-2-sonic-v1:0"),
    tools=STRANDS_TOOLS,
    system_prompt=voice_system_prompt,
    session_manager=AgentCoreMemorySessionManager(...),
)
```

- Receives binary PCM audio (16kHz, mono, 16-bit signed) from the frontend
- Streams binary PCM audio back to the frontend
- In-process x402 fallback (AgentCorePaymentsPlugin not supported by BidiAgent)
- Same 6 payment tools as text mode

### Payment Tools

```python
STRANDS_TOOLS = [
    strands_check_balance,    # GetPaymentInstrumentBalance
    strands_generate_image,   # x402 → image-gen seller → Nova Canvas
    strands_list_products,    # Storefront catalog
    strands_buy_product,      # x402 → storefront order
    strands_list_orders,      # Buyer order history
    strands_cancel_order,     # Seller refund
]
```

Each tool is decorated with `@tool` (Strands decorator). Payment tools use `_paid_request()` which returns a `PAYMENT_REQUIRED:` marker on 402 (plugin path) or executes the in-process x402 dance (fallback path).

---

## Layer 4: AWS AgentCore Payments

**Service:** Amazon Bedrock AgentCore Payments (public preview)

**Control Plane APIs:**
- `CreatePaymentCredentialProvider` — stores wallet vendor credentials
- `CreatePaymentManager` — creates a payment authority with an associated IAM role
- `CreatePaymentConnector` — links a manager to a credential provider

**Data Plane APIs:**
- `CreatePaymentInstrument` — provisions an embedded crypto wallet
- `GetPaymentInstrument` — retrieves wallet address and details
- `GetPaymentInstrumentBalance` — queries on-chain USDC balance
- `CreatePaymentSession` — creates a session with `limits.maxSpendAmount` and `expiryTimeInMinutes`
- `GetPaymentSession` / `ListPaymentSessions` / `DeletePaymentSession`
- `ProcessPayment` (type=`CRYPTO_X402`) — signs and executes a payment within session constraints

**Session constraint enforcement:**
- `ProcessPayment` validates the payment amount against the session's remaining `maxSpendAmount`
- If exceeded: raises `ValidationException` — no funds move
- If session expired: raises `SessionExpiredException` — no funds move
- The session cap cannot be bypassed by the agent — it is enforced at the AWS service level

---

## Payment Session / Control Flow

```
User creates session:
  maxSpendAmount = 5.00 USDC
  expiryTimeInMinutes = 60
  ↓
Agent receives payment context (managerArn, instrumentId, sessionId)
  ↓
Agent tool encounters HTTP 402 (buy_product, generate_image)
  ↓
AgentCorePaymentsPlugin
  ↓
ProcessPayment(
  paymentManagerArn = manager_arn,
  paymentInstrumentId = instrument_id,
  paymentSessionId = session_id,
  userId = cognito_sub,
  amount = x402_required_amount,
  type = CRYPTO_X402,
)
  ↓
AgentCore Payments checks: amount ≤ remaining session balance?
  YES → sign payment → return proof
  NO  → raise ValidationException
  ↓
Agent tool retries with X-PAYMENT header
  ↓
Seller verifies proof → delivers content
  ↓
Session remaining balance reduced by payment amount
```

---

## Infrastructure Components

### DynamoDB Tables

| Table | Partition Key | GSI | Contents |
|---|---|---|---|
| `StorefrontProducts` | `productId` | — | Product catalog: name, price, type, description |
| `StorefrontOrders` | `orderId` | `buyerUserId-index` | Orders: buyer, product, amount, network, status |
| `StorefrontSellerConfig` | `pk` | — | Seller payout wallet address per network |

### S3 Buckets

| Bucket | Purpose | Expiry |
|---|---|---|
| `agentcore-payments-media-{account}-{region}` | Agent-generated images (presigned URLs) | 1 day |
| Library bucket | Per-buyer digital content (`library/{userId}/...`) | None |
| Assets bucket | Seller deliverables (seeded at deploy) | None |

### IAM Roles

| Role | Purpose |
|---|---|
| `AgentCorePayments-AdminCP` | Admin Lambda → control-plane CRUD |
| `AgentCorePayments-UserDP` | User Lambda → data-plane ops |
| `AgentCorePayments-UserPaymentOptions` | Read-only: list managers + connectors |
| `AgentCorePayments-ManagerRole` | Assumed by AgentCore for payment execution |
| `AgentCorePayments-AgentExecution` | Assumed by AgentCore Runtime container |
| `AgentCorePayments-StorefrontSellerManager` | Assumed by AgentCore for seller payout |

### Secrets

| Secret | Contents | Access |
|---|---|---|
| `DemoAdminCredentials` | Auto-generated admin username + password | Deployer only |
| CDP/Privy credential secrets | Wallet vendor API keys | AgentCore Identity → agent runtime token exchange |

Secrets are stored with KMS encryption. The agent never sees raw API keys — only short-lived vendor tokens provided by AgentCore at signing time.

---

## Observability Stack

| Layer | Technology | What It Captures |
|---|---|---|
| Application tracing | ADOT + OTLP | Spans, traces, agent invocations |
| AgentCore Runtime | AWS X-Ray integration | Request traces to AgentCore Runtime |
| Payment transactions | AgentCore Payments vended log delivery | Per-payment transaction events → CloudWatch Logs |
| CloudWatch log group | `/bedrock-agentcore/payments/<managerId>` | Payment Manager transaction log stream |
| Metrics | `cloudwatch:PutMetricData` (namespace: `AgentCorePayments`) | Custom agent metrics |

---

## Deployment Architecture

```
Developer runs: npm run setup:backend
        │
        ▼
setup_backend.sh
        │
        ├── cd backend && npm install
        ├── pip install (shared Lambda layer)
        ├── cdk bootstrap
        ├── cdk deploy → CloudFormation creates all resources
        │              → CodeBuild Custom Resource triggers image build
        │              → CodeBuild: ARM64 Docker build → push to ECR
        │              → AgentCore Runtime created with ECR image URI
        │
        └── Outputs injected into .env

Developer runs: npm run setup:amplify
        │
        ▼
setup_amplify.sh
        │
        ├── Reads VITE_* env vars from .env
        ├── Creates Amplify app
        └── Deploys frontend/dist to HTTPS URL
```

---

## Security Architecture

| Concern | Mechanism |
|---|---|
| Frontend authentication | Cognito SRP → JWT (ID token) → API Gateway authorizer |
| Admin/user isolation | Cognito groups + route-level authorizer enforcement |
| Wallet credential storage | AWS Secrets Manager + KMS encryption |
| Agent key access | Short-lived vendor tokens at signing time only (never raw keys) |
| Session cap enforcement | AgentCore cloud-side — agent cannot bypass |
| S3 data security | Block all public access, enforce SSL, S3-managed encryption |
| Network isolation | AgentCore Runtime: public endpoint with workload identity tokens |
| Secret handling | `.env` gitignored; no secrets in source control |
