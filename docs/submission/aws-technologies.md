# Nexus Pay — AWS Technologies

## Overview

Nexus Pay is built entirely on AWS. This document catalogs every AWS service used, explains what role it plays, and distinguishes between infrastructure services (AWS provides the mechanism) and the Nexus Pay product layer (what we built on top).

All services listed here are verifiably used in the repository.

---

## AWS AgentCore

**Component:** Amazon Bedrock AgentCore (public preview)

### AgentCore Runtime

**What it is:** A managed container runtime for AI agent workloads.

**How Nexus Pay uses it:**
- Deploys the Nexus Pay AI agent as an ARM64 Docker container
- Container image is built by CodeBuild and stored in ECR
- The Runtime exposes the container's HTTP/WebSocket endpoints and manages scaling, health, and workload identity
- `InvokeAgentRuntimeWithWebsocketStream` creates a presigned WebSocket URL that the frontend connects to directly
- `InvokeAgentRuntime` provides a REST fallback for synchronous text interaction

**Files:** `backend/lib/payment-agent-stack.ts` (CfnRuntime), `backend/lambdas/user/agent/`

### AgentCore Payments

**What it is:** A managed API for embedding payment capabilities into AI agents.

**Control plane (admin):**
- `CreatePaymentCredentialProvider` — stores Coinbase CDP or Stripe/Privy API credentials in Secrets Manager
- `CreatePaymentManager` — creates a payment authority with an IAM service role
- `CreatePaymentConnector` — links a manager to a credential provider

**Data plane (user + agent):**
- `CreatePaymentInstrument` — provisions an embedded crypto wallet (EVM or Solana)
- `GetPaymentInstrument` — retrieves wallet address and network details
- `GetPaymentInstrumentBalance` — queries live on-chain USDC balance
- `CreatePaymentSession` — creates a capped, time-limited payment authorization
- `ProcessPayment (CRYPTO_X402)` — signs and executes an x402 payment within session constraints
- Session constraint enforcement: `ProcessPayment` raises `ValidationException` if amount exceeds `maxSpendAmount`

**Files:** `backend/lambdas/admin/`, `backend/lambdas/user/instruments/`, `backend/lambdas/user/sessions/`, `payment-agent/agent.py`, `payment-agent/tools.py`

### AgentCore Memory

**What it is:** Managed persistent memory for AI agent conversation history.

**How Nexus Pay uses it:**
- `AgentCoreMemorySessionManager` is attached to both text-mode and voice-mode agents
- A fresh `session_id` (UUID-suffixed) is created per WebSocket connection
- Memory is keyed to the user's Cognito sub (`actor_id`)
- The agent recalls prior purchases, preferences, and conversation context across turns

**Resource:** `CfnMemory` (name: `agentcore_payments_memory`)

**Files:** `backend/lib/payment-agent-stack.ts` (CfnMemory), `payment-agent/agent.py`

---

## Amazon Bedrock (Foundation Models)

### Claude Sonnet 4.6 (`us.anthropic.claude-sonnet-4-6`)

**Role:** Primary reasoning and tool-use model for the text-mode AI payment agent.

**How it's used:**
- Multi-step tool-use: the agent calls `check_balance`, `list_products`, `buy_product`, `generate_image`, `list_orders`, `cancel_order`
- Cross-region inference profile (`us.` prefix) for load balancing across US regions
- Streaming responses via `stream_async`

### Amazon Nova Sonic (`amazon.nova-2-sonic-v1:0`)

**Role:** Speech-to-speech model for the voice mode AI payment agent.

**How it's used:**
- `BidiAgent` + `BidiNovaSonicModel` — bidirectional audio streaming
- Receives PCM audio (16kHz, mono, 16-bit) from the browser microphone
- Returns PCM audio to the browser speaker
- Same 6 payment tools as text mode

### Amazon Nova Canvas (`amazon.nova-canvas-v1:0`)

**Role:** Image generation model for the AI image-gen paid service.

**How it's used:**
- The `image-gen` seller Lambda calls `bedrock:InvokeModel` with Nova Canvas
- Triggered by the agent's `generate_image` tool via the x402 payment flow
- Generated image is uploaded to S3 Media Bucket; presigned URL returned to the agent

**Files:** `backend/lambdas/sellers/image-gen/`

---

## Amazon Cognito

**Role:** User authentication, authorization, and role management.

**How Nexus Pay uses it:**
- Email-based self-signup with SRP authentication
- ID tokens used as Bearer tokens on every API request
- Two Cognito groups: `admin` (manual assignment) and `user` (auto-assigned via PostConfirmation Lambda)
- HTTP API JWT authorizer validates tokens and enforces group-based access

**Key design decision:** `AdminCreateUserConfig.AllowAdminCreateUserOnly: false` — self-signup is intentionally enabled so any user can register without admin intervention.

**Files:** `backend/lib/payment-agent-stack.ts` (UserPool, CfnUserPoolGroup), `frontend/src/lib/auth.ts`

---

## AWS Lambda

**Role:** All backend business logic, serverless, no servers to manage.

**Python 3.13 functions:**
| Function | Purpose |
|---|---|
| `agentcore-payments-post-confirm` | PostConfirmation trigger: auto-assign user to `user` group |
| `agentcore-payments-credential-providers` | Admin CRUD for credential providers |
| `agentcore-payments-managers` | Admin CRUD for payment managers |
| `agentcore-payments-connectors` | Admin CRUD for payment connectors |
| `agentcore-payments-instruments` | User: create/list/get/delete instruments + balance |
| `agentcore-payments-sessions` | User: create/list/get/delete sessions |
| `agentcore-payments-agent-ws` | Returns presigned WebSocket URL to AgentCore Runtime |
| `agentcore-payments-payment-options` | Read-only: list managers + connectors for user bootstrap |
| `agentcore-payments-build-trigger` | Custom Resource: triggers CodeBuild, polls for completion |

**Node.js 22 ARM64 functions:**
| Function | Purpose |
|---|---|
| `x402-seller-image-gen` | x402 image-gen: validate payment → Nova Canvas → S3 → presigned URL |
| Storefront functions | Products, orders, refunds, library (separate seller API) |

**Files:** `backend/lambdas/`

---

## Amazon API Gateway (HTTP API v2)

**Role:** HTTP API layer between frontend and Lambda functions.

**Main API (`agentcore-payments-api`):**
- Cognito JWT authorizer on all routes
- Admin routes: `/admin/*`
- User routes: `/user/*`
- CORS: allows all origins (appropriate for hackathon demo)

**Seller API (`x402-sellers-api`):**
- No Cognito — x402 payment proof IS the authorization
- Custom headers allowed: `X-Payment`, `X-Payment-Response`

**Files:** `backend/lib/payment-agent-stack.ts`

---

## Amazon DynamoDB

**Role:** Storage for products, orders, and seller configuration.

| Table | GSI | Contents |
|---|---|---|
| `StorefrontProducts` | — | Product catalog (name, price, type, description, deliverableKey) |
| `StorefrontOrders` | `buyerUserId-index` | Orders (orderId, buyerUserId, product, amount, status, network) |
| `StorefrontSellerConfig` | — | Seller payout wallet addresses per network (EVM, Solana) |

All tables use on-demand (pay-per-request) billing. All enable point-in-time recovery.

**Files:** `backend/lib/payment-agent-stack.ts` (dynamodb.Table), `backend/lambdas/sellers/`

---

## Amazon S3

**Role:** Object storage for media, library content, and deliverable assets.

| Bucket | Purpose | TTL |
|---|---|---|
| `agentcore-payments-media-{account}-{region}` | Agent-generated image presigned URLs | 1 day lifecycle |
| Library bucket | Per-buyer purchased digital content (`library/{userId}/...`) | None |
| Assets bucket | Seller deliverable files (seeded at deploy via BucketDeployment) | None |

All buckets: block all public access, enforce SSL, S3-managed server-side encryption.

**Files:** `backend/lib/payment-agent-stack.ts`

---

## Amazon ECR (Elastic Container Registry)

**Role:** Container image registry for the AI agent Docker image.

**Repo:** `agentcore-payments-agent`
- ARM64 images built by CodeBuild
- Lifecycle rule: keep last 5 images
- Lifecycle: `DESTROY` (appropriate for dev/hackathon)

**Files:** `backend/lib/payment-agent-stack.ts` (ecr.Repository)

---

## AWS CodeBuild

**Role:** Builds the ARM64 Docker image for the AI agent container.

**Project:** `agentcore-payments-agent-build`
- Build image: `LinuxArmBuildImage.AMAZON_LINUX_2_STANDARD_3_0`
- Privileged mode: enabled (Docker-in-Docker)
- Source: CDK S3 asset (zipped `payment-agent/` directory)
- Rebuild triggered automatically when `payment-agent/` changes (tied to asset hash)
- Build trigger is a CDK Custom Resource — waits for build completion before creating AgentCore Runtime

**Files:** `backend/lib/payment-agent-stack.ts` (codebuild.Project, CustomResource)

---

## AWS CloudFormation / CDK

**Role:** Infrastructure as code — the entire stack is defined in a single TypeScript CDK file.

**Stack:** `PaymentAgentStack` (`backend/lib/payment-agent-stack.ts`)
- 1225 lines of CDK TypeScript
- Creates and manages all 30+ AWS resources
- CDK version: 2.1128.1
- `cdk deploy` is the single command to provision all infrastructure

**Files:** `backend/lib/payment-agent-stack.ts`, `backend/bin/payment-agent.ts`, `backend/cdk.json`

---

## AWS Secrets Manager

**Role:** Secure storage for credentials.

**Secrets stored:**
- Admin demo credentials (auto-generated password, username hardcoded) — CDK-managed, `DESTROY` policy
- Wallet provider credential secrets (created by AgentCore Identity via CreatePaymentCredentialProvider) — ARN referenced by agent but raw values never returned to it

**Encryption:** KMS-managed

**Files:** `backend/lib/payment-agent-stack.ts` (secretsmanager.Secret), `docs/credentials.md`

---

## AWS X-Ray / ADOT

**Role:** Distributed tracing for the AI agent container.

**Implementation:**
- ADOT (AWS Distro for OpenTelemetry) auto-instrumentation loaded at agent startup
- OTLP export to the AgentCore Runtime collector
- `OTEL_SERVICE_NAME=agentcore-payments-agent`
- X-Ray active tracing on AgentCore agent execution role

**Files:** `payment-agent/agent.py` (ADOT init block)

---

## Amazon CloudWatch

**Role:** Log delivery and metrics.

**AgentCore Payments Vended Log Delivery:**
- On first agent invocation, agent calls `put_delivery_source`, `put_delivery_destination`, `create_delivery`
- Payment Manager transaction logs stream to CloudWatch Logs at `/bedrock-agentcore/payments/<managerId>`
- `ENABLE_VENDED_LOG_DELIVERY=1` controls this feature

**Custom Metrics:**
- `cloudwatch:PutMetricData` (namespace: `AgentCorePayments`) in agent execution role

**Files:** `payment-agent/agent.py` (`_maybe_wire_vended_logs`), `backend/lib/payment-agent-stack.ts` (IAM grants)

---

## Amazon Amplify

**Role:** Hosting for the React frontend SPA.

**How it's used:**
- `setup_amplify.sh` creates an Amplify app and deploys `frontend/dist`
- `amplify.yml` defines the build configuration
- Serves the SPA over HTTPS with a generated Amplify URL

**Files:** `test/integration/setup_amplify.sh`, `amplify.yml`

---

## AWS IAM

**Role:** Identity and access management — fine-grained permissions for every component.

**Key roles:**
| Role | Scope |
|---|---|
| `AgentCorePayments-AdminCP` | Lambda: control-plane CRUD only |
| `AgentCorePayments-UserDP` | Lambda: data-plane instruments/sessions/payments |
| `AgentCorePayments-UserPaymentOptions` | Lambda: read-only list only |
| `AgentCorePayments-ManagerRole` | AgentCore: payment execution service role |
| `AgentCorePayments-AgentExecution` | AgentCore Runtime: container execution |
| `AgentCorePayments-StorefrontSellerManager` | AgentCore: seller payout manager |

All roles follow least-privilege principles with explicit `iam:PassRole` constraints.

---

## Summary: AWS Services by Category

| Category | Services |
|---|---|
| **AI / ML** | Amazon Bedrock AgentCore (Runtime, Payments, Memory), Amazon Bedrock (Claude, Nova Sonic, Nova Canvas) |
| **Serverless Compute** | AWS Lambda (Python 3.13, Node.js 22) |
| **API** | Amazon API Gateway HTTP v2 |
| **Auth** | Amazon Cognito |
| **Storage** | Amazon S3, Amazon DynamoDB |
| **Containers** | Amazon ECR, AWS CodeBuild |
| **Infrastructure** | AWS CloudFormation, AWS CDK |
| **Security** | AWS Secrets Manager, AWS KMS, AWS IAM |
| **Observability** | AWS X-Ray, Amazon CloudWatch, ADOT |
| **Hosting** | AWS Amplify |
