# Nexus Pay — API Reference

## Authentication
The deployed main API uses a Cognito JWT authorizer. Frontend requests attach the Cognito ID token as a Bearer token.

## Admin APIs

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/admin/credential-providers` | List credential providers |
| POST | `/admin/credential-providers` | Create credential provider |
| PUT | `/admin/credential-providers/{id}` | Update credential provider |
| DELETE | `/admin/credential-providers/{id}` | Delete credential provider |
| GET | `/admin/managers` | List payment managers |
| POST | `/admin/managers` | Create payment manager |
| PUT | `/admin/managers/{id}` | Update payment manager |
| DELETE | `/admin/managers/{id}` | Delete payment manager |
| GET | `/admin/connectors` | List connectors |
| POST | `/admin/connectors` | Create connector |
| PUT | `/admin/connectors/{id}` | Update connector |
| DELETE | `/admin/connectors/{id}` | Delete connector |

## User APIs

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/user/payment-options` | Discover payment options |
| GET | `/user/instruments` | List instruments |
| POST | `/user/instruments` | Create instrument |
| GET | `/user/instruments/{id}` | Get instrument |
| DELETE | `/user/instruments/{id}` | Delete instrument |
| GET | `/user/instruments/{id}/balance` | Get balance |
| GET | `/user/sessions` | List sessions |
| POST | `/user/sessions` | Create session |
| GET | `/user/sessions/{id}` | Get session |
| DELETE | `/user/sessions/{id}` | Delete session |
| GET | `/user/agent/ws-url` | Generate AgentCore WebSocket URL |
| POST | `/user/agent/invoke` | Agent REST fallback |

## Storefront APIs

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/products` | List products |
| GET | `/products/{id}` | Get product |
| POST | `/orders` | Create x402-gated order |
| GET | `/orders` | List orders |
| GET | `/orders/{id}` | Get order |
| POST | `/orders/{id}/refund` | User refund |
| GET | `/orders/{id}/download` | Download asset |

## Seller APIs

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/image-gen` | x402-gated image generation |
| GET | `/image-gen` | Endpoint/status |
| GET | `/health` | Health check |

## Frontend Integration Functions

The audited frontend integration includes:

```text
getPaymentOptions()
listAllInstruments()
createInstrument()
getInstrument()
deleteInstrument()
getInstrumentBalance()

listAllSessions()
createSession()
getSession()
deleteSession()

getAgentWsUrl()
invokeAgent()
```

Administrative functions cover credential providers, payment managers, connectors and storefront administration.

## Agent WebSocket

The frontend calls `/user/agent/ws-url`, connects to the resulting AgentCore Runtime URL and sends an `init` frame with user/payment context.

A later `context_update` frame can update wallet/session context.

## Agent Events

Relevant audited event types include:

- `text_stream`
- `text_done`
- `tool_use`
- `media`

Voice interaction additionally streams transcript/audio data.

## x402
x402 merchant endpoints can return HTTP `402 Payment Required`. In the connected flow, the agent/payment infrastructure obtains payment proof and retries the merchant request.

## Local Limitation
Local `/user/pay` is a simulation and does not call a live transfer endpoint.
