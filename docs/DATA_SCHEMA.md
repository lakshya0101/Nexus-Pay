# Nexus Pay — Data Schema

This document describes the payment-related TypeScript models audited in `frontend/src/types/index.ts`.

## Vendor
```text
'CoinbaseCDP' | 'StripePrivy'
```

## CredentialProvider
```text
name: string
credentialProviderVendor: string
credentialProviderArn: string
providerConfigurationOutput:
  coinbaseCdpConfiguration?:
    apiKeyId
    apiKeySecretArn
    walletSecretArn
  stripePrivyConfiguration?:
    appId
    appSecretArn
    authorizationId
    authorizationPrivateKeyArn
status
createdAt
updatedAt
```

## PaymentManager
```text
paymentManagerId: string
paymentManagerArn: string
name: string
description?: string
authorizerType: string
roleArn: string
workloadIdentityDetails?: { workloadIdentityArn: string }
status: string
```

## PaymentConnector
```text
paymentConnectorId: string
paymentManagerId: string
name: string
type: string
credentialProviderConfigurations: array
status: string
```

## PaymentInstrument
```text
paymentInstrumentId: string
paymentManagerArn: string
paymentConnectorId: string
userId: string
paymentInstrumentType: string
paymentInstrumentDetails:
  cryptoWallet?:
    network
    walletAddress
  embeddedCryptoWallet?:
    network
    walletAddress
    linkedAccounts[]
    redirectUrl?
status: string
```

## PaymentSession
```text
paymentSessionId: string
paymentManagerArn: string
userId: string
limits:
  maxSpendAmount:
    value: string
    currency: string
expiryTimeInMinutes: number
currentSpendAmount?:
  value: string
  currency: string
status?: string
```

## ProcessPaymentResult
```text
processPaymentId: string
paymentManagerArn: string
paymentSessionId: string
paymentInstrumentId: string
paymentType: string
status: string
paymentOutput?:
  cryptoX402?:
    version: string
    payload:
      authorization: Record<string, string>
      signature: string
```

## Relationships
```text
CredentialProvider
      ↓
PaymentConnector
      ↓
PaymentManager
      ↓
PaymentInstrument
      ↓
PaymentSession
      ↓
ProcessPaymentResult
```

## Local Demo
The local Pay experience creates simulated transaction state. It should not be interpreted as a live `ProcessPaymentResult` or blockchain settlement record.
