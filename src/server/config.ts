import crypto from 'crypto';

export const JWT_SECRET = process.env.JWT_SECRET || 'kibosh_jwt_super_secret_key_prod_2026_x89f2a0!b';
export const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'kibosh_refresh_token_super_secret_key_prod_2026_99z!c';

export const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
export const REFRESH_TOKEN_EXPIRY_DAYS = 7; // 7 days

export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export const MAX_PDF_STORE_SIZE = 500;
export const PDF_STORE_TTL_MS = 60 * 60 * 1000; // 1 hour

// SSRF Blocklist for Outbound Network Connections (SMTP, Webhooks)
export const BLOCKED_IP_RANGES = [
  /^127\./,                 // Loopback
  /^10\./,                  // Private Class A
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private Class B
  /^192\.168\./,            // Private Class C
  /^169\.254\./,            // AWS / Cloud Metadata API
  /^0\./,                   // Current network
  /^::1$/,                  // IPv6 Loopback
  /^fe80:/i,                // IPv6 Link-Local
  /^fc00:/i,                // IPv6 Unique Local
];

export const BLOCKED_HOSTNAMES = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  'instance-data',
  'metadata.google.internal',
  '169.254.169.254'
];
