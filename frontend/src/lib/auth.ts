/**
 * Cognito auth helpers using amazon-cognito-identity-js.
 * Config comes from env vars (VITE_ prefix for Vite).
 */
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserSession,
  CognitoUserAttribute,
} from 'amazon-cognito-identity-js'

const USER_POOL_ID = (import.meta.env.VITE_COGNITO_USER_POOL_ID as string | undefined)?.trim()
const CLIENT_ID = (import.meta.env.VITE_COGNITO_CLIENT_ID as string | undefined)?.trim()

export const isAuthConfigured = (): boolean => Boolean(USER_POOL_ID && CLIENT_ID)

const userPool: CognitoUserPool | null = isAuthConfigured()
  ? new CognitoUserPool({
      UserPoolId: USER_POOL_ID!,
      ClientId: CLIENT_ID!,
    })
  : null

export type UserRole = 'admin' | 'user'

export function getRoleFromSession(session: CognitoUserSession): UserRole {
  const groups: string[] = session.getIdToken().payload['cognito:groups'] || []
  if (groups.includes('admin')) return 'admin'
  return 'user'
}

export function signIn(email: string, password: string): Promise<CognitoUserSession> {
  if (!userPool) {
    return Promise.reject(
      new Error('Authentication is not configured. AWS Cognito User Pool environment variables (VITE_COGNITO_USER_POOL_ID, VITE_COGNITO_CLIENT_ID) are missing.')
    )
  }

  const user = new CognitoUser({ Username: email, Pool: userPool })
  const authDetails = new AuthenticationDetails({ Username: email, Password: password })

  return new Promise((resolve, reject) => {
    user.authenticateUser(authDetails, {
      onSuccess: (session) => resolve(session),
      onFailure: (err) => reject(err),
      newPasswordRequired: () => reject(new Error('New password required — reset in AWS Console')),
    })
  })
}

export function signUp(email: string, password: string): Promise<void> {
  if (!userPool) {
    return Promise.reject(
      new Error('Authentication is not configured. AWS Cognito User Pool environment variables (VITE_COGNITO_USER_POOL_ID, VITE_COGNITO_CLIENT_ID) are missing.')
    )
  }

  const attributes = [
    new CognitoUserAttribute({ Name: 'email', Value: email }),
  ]
  return new Promise((resolve, reject) => {
    userPool.signUp(email, password, attributes, [], (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

export function confirmSignUp(email: string, code: string): Promise<void> {
  if (!userPool) {
    return Promise.reject(
      new Error('Authentication is not configured. AWS Cognito User Pool environment variables (VITE_COGNITO_USER_POOL_ID, VITE_COGNITO_CLIENT_ID) are missing.')
    )
  }

  const user = new CognitoUser({ Username: email, Pool: userPool })
  return new Promise((resolve, reject) => {
    user.confirmRegistration(code, true, (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

export function signOut(): void {
  if (!userPool) return
  const user = userPool.getCurrentUser()
  user?.signOut()
}

export function getSession(): Promise<CognitoUserSession | null> {
  if (!userPool) return Promise.resolve(null)
  const user = userPool.getCurrentUser()
  if (!user) return Promise.resolve(null)

  return new Promise((resolve) => {
    user.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session?.isValid()) {
        resolve(null)
      } else {
        resolve(session)
      }
    })
  })
}

export async function getIdToken(): Promise<string | null> {
  const session = await getSession()
  return session?.getIdToken().getJwtToken() ?? null
}

export function getCurrentUserId(): Promise<string | null> {
  return getSession().then((s) => s?.getIdToken().payload?.sub ?? null)
}
