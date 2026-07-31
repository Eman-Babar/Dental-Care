import jwt from "jsonwebtoken";

/**
 * Require JWT_SECRET from env — never fall back to a hardcoded secret.
 */
export function getJwtSecret() {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret || secret === "your_jwt_secret_key") {
    throw new Error(
      "JWT_SECRET is missing or still a placeholder. Set a strong secret in server/.env"
    );
  }
  return secret;
}

export function signAuthToken(id, role, expiresIn = "7d") {
  return jwt.sign({ id, role }, getJwtSecret(), { expiresIn });
}

export function verifyAuthToken(token) {
  return jwt.verify(token, getJwtSecret());
}
