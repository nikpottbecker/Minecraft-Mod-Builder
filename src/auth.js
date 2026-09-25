const COOKIE_NAME = 'f1_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8h

function toBase64Url(bytes) {
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(b64url) {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const str = atob(b64);
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
  return bytes;
}

async function getKey(secret) {
  const enc = new TextEncoder();
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ]);
}

export async function createSessionCookie(username, secret) {
  const payload = JSON.stringify({ u: username, exp: Date.now() + SESSION_TTL_SECONDS * 1000 });
  const enc = new TextEncoder();
  const payloadB64 = toBase64Url(enc.encode(payload));
  const key = await getKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payloadB64));
  const sigB64 = toBase64Url(new Uint8Array(sig));
  const value = `${payloadB64}.${sigB64}`;
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export async function readSession(cookieHeader, secret) {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return null;
  const [payloadB64, sigB64] = match[1].split('.');
  if (!payloadB64 || !sigB64) return null;

  try {
    const key = await getKey(secret);
    const enc = new TextEncoder();
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      fromBase64Url(sigB64),
      enc.encode(payloadB64)
    );
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(payloadB64)));
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
