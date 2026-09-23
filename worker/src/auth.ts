import { Context, Next } from 'hono';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { DecodedUser, Env } from './types';
import { upsertUser } from './db';

const GOOGLE_JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
const JWKS = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL));

export async function verifyFirebaseToken(
  token: string,
  projectId: string
): Promise<DecodedUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });

    return {
      uid: payload.sub || (payload.user_id as string),
      email: (payload.email as string) || null,
      name: (payload.name as string) || null,
      picture: (payload.picture as string) || null,
    };
  } catch (err) {
    console.error('[AUTH] Token verification failed:', err);
    return null;
  }
}

export async function authMiddleware(
  c: Context<{ Bindings: Env; Variables: { user?: DecodedUser } }>,
  next: Next
) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid Authorization header' }, 401);
  }

  const token = authHeader.substring(7).trim();
  const projectId = c.env.FIREBASE_PROJECT_ID || 'studyassistant-26fb6';

  const user = await verifyFirebaseToken(token, projectId);
  if (!user) {
    return c.json({ error: 'Invalid or expired Firebase token' }, 401);
  }

  // Ensure user is recorded in D1 database
  try {
    await upsertUser(c.env.DB, {
      firebase_uid: user.uid,
      email: user.email,
      display_name: user.name,
      photo_url: user.picture,
    });
  } catch (err) {
    console.warn('[AUTH] Error syncing user to DB:', err);
  }

  c.set('user', user);
  await next();
}

export async function optionalAuthMiddleware(
  c: Context<{ Bindings: Env; Variables: { user?: DecodedUser } }>,
  next: Next
) {
  const authHeader = c.req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const projectId = c.env.FIREBASE_PROJECT_ID || 'studyassistant-26fb6';
    const user = await verifyFirebaseToken(token, projectId);
    if (user) {
      try {
        await upsertUser(c.env.DB, {
          firebase_uid: user.uid,
          email: user.email,
          display_name: user.name,
          photo_url: user.picture,
        });
      } catch (err) {
        console.warn('[AUTH] Error syncing user to DB:', err);
      }
      c.set('user', user);
    }
  }
  await next();
}
