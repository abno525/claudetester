import jwt from 'jsonwebtoken';

interface TokenPayload {
  challengeId: string;
  solvedAt: string;
}

/**
 * Generate a signed JWT verification token.
 */
export function generateToken(
  challengeId: string,
  solvedAt: Date,
  secret: string,
  expiresInSeconds: number = 300
): string {
  const payload: TokenPayload = {
    challengeId,
    solvedAt: solvedAt.toISOString(),
  };

  return jwt.sign(payload, secret, { expiresIn: expiresInSeconds });
}

/**
 * Validate and decode a JWT verification token.
 * Returns the payload if valid, or an error reason string.
 */
export function validateToken(
  token: string,
  secret: string
): { valid: true; payload: TokenPayload } | { valid: false; reason: string } {
  try {
    const payload = jwt.verify(token, secret) as TokenPayload;
    return { valid: true, payload };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return { valid: false, reason: 'token_expired' };
    }
    return { valid: false, reason: 'token_invalid' };
  }
}
