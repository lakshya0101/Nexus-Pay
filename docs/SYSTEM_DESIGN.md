# Nexus Pay — System Design

## Design Goal
Separate the product experience from payment infrastructure so that users receive a simple Web3 payment interface while agent-driven payment actions operate within explicit payment context and spending sessions.

## Logical Layers

```text
Presentation
    ↓
Zustand State
    ↓
REST / WebSocket Integration
    ↓
API Gateway / AgentCore Runtime
    ↓
Serverless Backend / Payment Agent
    ↓
Agent Tools
    ↓
AgentCore Payments
    ↓
x402 / Blockchain
```

## Frontend
React pages provide Dashboard, Pay, Wallets, AI Agent, Allowances and History. Shared UI components provide the design system.

## State Management
`useAuthStore` handles authentication and mock bypasses. `useUserStore` handles instruments, sessions, transactions and demo data. `useChatStore` handles agent messages, WebSocket status and voice mode.

## Backend
Lambda functions provide separate admin and user APIs. User APIs manage payment options, instruments, sessions and agent connectivity.

## Agent
The FastAPI payment agent uses Strands Agents. Its audited tools include balance lookup, product discovery, product purchase, image generation, order history and order cancellation.

## Payment Sessions
A payment session contains a maximum spend amount, currency, expiry and current spend information. It provides bounded payment context for agent activity.

## Agent Communication
The frontend requests `/user/agent/ws-url`, receives a SigV4-presigned WSS URL, then connects to Bedrock AgentCore Runtime. An `init` frame provides user/payment context, and `context_update` can change selected wallet/session context without reconnecting.

## Authentication
Production mode uses Cognito signup, confirmation, JWTs and group-based roles. Local Demo Mode uses mock state when Cognito is not configured.

## Local vs Connected
Local:
```text
Browser → Nexus Pay UI → Zustand demo state → simulated payment
```

Connected:
```text
Browser → Cognito/API Gateway → Lambda/AgentCore Runtime
        → Payment Agent → AgentCore Payments → x402 → Blockchain
```
