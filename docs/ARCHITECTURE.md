# Nexus Pay — Architecture

## Overview
Nexus Pay is an AI-powered programmable Web3 payment experience built on an agentic payment infrastructure. The React frontend provides the product experience while AWS serverless services, Bedrock AgentCore and the containerized payment agent provide the connected payment capabilities.

## High-Level Architecture

```text
User
  ↓
Nexus Pay Frontend
  ├── Cognito / Mock Demo Auth
  ├── Wallet & Payment UI
  ├── Allowances / Payment Sessions
  └── AI Agent UI
        ↓
API Gateway / AgentCore Runtime
        ↓
Serverless Backend + Payment Agent
        ↓
AgentCore Payments
        ↓
x402
        ↓
Base Sepolia / Solana Devnet
```

## Major Components

### Frontend
`frontend/` is a React 19 + TypeScript + Vite SPA with React Router, Tailwind CSS, Zustand state management, REST clients and WebSocket agent communication.

Primary user routes:
- `/user` — Dashboard
- `/user/pay` — Pay
- `/user/wallets` — Wallets / Payment Instruments
- `/user/agent` — AI Agent
- `/user/allowances` — Payment Sessions
- `/user/history` — History
- `/user/connect-agent` — Privy signer attachment

### Payment Agent
`payment-agent/` is a containerized Python FastAPI/Uvicorn service using Strands Agents. It exposes health endpoints, REST invocation and WebSocket streaming for text and voice interactions.

### Backend
`backend/` contains the AWS CDK `PaymentAgentStack`, Lambda functions and serverless resources including API Gateway, Cognito, DynamoDB, S3, CodeBuild and AgentCore resources.

### x402 Seller / Storefront
Seller functions provide x402-gated image generation and storefront/order workflows.

## AWS Payment Layer
The audited implementation references AgentCore Payments operations including `ProcessPayment`, `GetPaymentInstrumentBalance`, `CreatePaymentSession`, `GetPaymentSession` and `CreatePaymentInstrument`.

## Web3 Layer
The implementation references Base Sepolia and Solana Devnet, USDC and x402. Base Sepolia uses EIP-3009 authorization signatures and Solana Devnet uses SPL token transfer instructions.

## Deployment Boundary
Local Demo Mode can demonstrate the UI, mock authentication, seeded wallets/sessions/history and simulated payment progression without deploying the complete AWS stack.

Live Cognito authentication, AgentCore Runtime connectivity and real x402 settlement require the corresponding AWS infrastructure and configuration.
