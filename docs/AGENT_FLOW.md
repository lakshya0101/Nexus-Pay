# Nexus Pay — Agent Flow

## Purpose
The Nexus Pay agent connects natural-language intent with bounded payment infrastructure.

The core product principle is:

> AI can assist with payment actions while payment instruments and payment sessions define the payment context.

## Flow

```text
User Intent
    ↓
Nexus Pay Frontend
    ↓
AgentCore Runtime
    ↓
Payment Agent
    ↓
Agent Tool
    ↓
Payment Session / Instrument
    ↓
AgentCore Payments
    ↓
x402 / Merchant
    ↓
Result
```

## Connection
The frontend calls `GET /user/agent/ws-url` to obtain a SigV4-presigned WebSocket URL and connects to Bedrock AgentCore Runtime.

## Initialization
The client sends an `init` frame containing context such as user ID, mode, instrument ID, wallet address, network, connector ID, manager ARN, session ID and email.

## Context Updates
A `context_update` frame can rebind selected wallet/session context without reconnecting.

## Text
The agent streams text events including `text_stream` and `text_done`. Tool activity can surface as `tool_use`; media output can use `media`.

## Voice
The voice path streams 16 kHz PCM audio and returns incremental transcript/audio events.

## Agent Tools
- `check_balance` — payment instrument balance
- `list_products` — storefront catalog
- `buy_product` — purchase flow with x402 handling
- `generate_image` — x402-gated image generation
- `list_orders` — buyer order history
- `cancel_order` — refund flow using a capped session

## x402 Agent Loop
```text
Agent → Merchant Request
     ← HTTP 402
       ↓
Process Payment
       ↓
Payment Proof
       ↓
Retry Request
       ↓
Resource Response
```

## Safety Boundary
The agent is not presented as having unrestricted wallet access. Payment activity is associated with payment instruments and bounded payment sessions containing spend limits and expiry.

## Local Demo
Local Demo Mode does not connect to the deployed agent runtime. It demonstrates the agent product experience with mock/seeded state.
