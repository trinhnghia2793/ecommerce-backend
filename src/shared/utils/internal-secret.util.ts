import { timingSafeEqual } from 'crypto';

// compare secret keys which avoiding timing attack
export function verifyInternalSecret(
  provided: string | undefined | null, // from request header
  expected: string | undefined | null, // from backend
): boolean {
  const received = provided?.trim();
  const configured = expected?.trim();

  if (!received || !configured) return false;

  const receivedBuf = Buffer.from(received, 'utf-8');
  const configuredBuf = Buffer.from(configured, 'utf-8');

  if (receivedBuf.length !== configuredBuf.length) return false;

  return timingSafeEqual(receivedBuf, configuredBuf);
}
