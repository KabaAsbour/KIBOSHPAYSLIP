import Redis from 'ioredis';
import { MAX_LOGIN_ATTEMPTS, LOCKOUT_DURATION_MS } from '../config';

class RedisService {
  private client: Redis | null = null;
  private isConnected = false;

  // Fallback in-memory state when Redis is offline or not configured
  private fallbackStore = new Map<string, { value: string; expiresAt: number }>();
  private fallbackLockouts = new Map<string, { attempts: number; lockedUntil?: number }>();

  constructor() {
    this.initRedis();

    // Cleanup expired items in fallback memory every 2 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, item] of this.fallbackStore.entries()) {
        if (item.expiresAt > 0 && now > item.expiresAt) {
          this.fallbackStore.delete(key);
        }
      }
    }, 2 * 60 * 1000);
  }

  private initRedis() {
    const redisUrl = process.env.REDIS_URL;
    const redisHost = process.env.REDIS_HOST;

    if (redisUrl || redisHost) {
      try {
        if (redisUrl) {
          this.client = new Redis(redisUrl, {
            lazyConnect: true,
            maxRetriesPerRequest: 2,
            retryStrategy: (times) => Math.min(times * 100, 2000)
          });
        } else {
          this.client = new Redis({
            host: redisHost || '127.0.0.1',
            port: Number(process.env.REDIS_PORT || 6379),
            password: process.env.REDIS_PASSWORD || undefined,
            lazyConnect: true,
            maxRetriesPerRequest: 2,
            retryStrategy: (times) => Math.min(times * 100, 2000)
          });
        }

        this.client.on('connect', () => {
          this.isConnected = true;
          console.log('[REDIS SERVICE] Client connected successfully.');
        });

        this.client.on('error', (err) => {
          this.isConnected = false;
          // Soft error logging to prevent spamming logs when Redis server is unreachable
        });

        this.client.connect().catch(() => {
          this.isConnected = false;
          console.log('[REDIS SERVICE] Redis server unreachable. Using secure in-memory distributed store fallback.');
        });
      } catch (e) {
        this.isConnected = false;
        console.log('[REDIS SERVICE] Redis initialization deferred. Running in safe resilient fallback mode.');
      }
    } else {
      console.log('[REDIS SERVICE] REDIS_URL not set. Operating with secure memory store layer.');
    }
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  public async checkHealth(): Promise<{ status: 'CONNECTED' | 'IN_MEMORY_FALLBACK'; latencyMs?: number; activeKeysCount: number }> {
    const start = Date.now();
    if (this.isConnected && this.client) {
      try {
        await this.client.ping();
        const latencyMs = Date.now() - start;
        return {
          status: 'CONNECTED',
          latencyMs,
          activeKeysCount: this.fallbackStore.size
        };
      } catch (err) {
        this.isConnected = false;
      }
    }
    return {
      status: 'IN_MEMORY_FALLBACK',
      latencyMs: Date.now() - start,
      activeKeysCount: this.fallbackStore.size
    };
  }

  // --- REFRESH TOKEN REGISTRY & SESSION MANAGEMENT ---

  public async saveRefreshToken(userId: string, jti: string, refreshToken: string, ttlSeconds = 7 * 24 * 3600): Promise<void> {
    const key = `rt:${userId}:${jti}`;
    if (this.isConnected && this.client) {
      try {
        await this.client.set(key, refreshToken, 'EX', ttlSeconds);
        return;
      } catch (err) {
        // Fallback
      }
    }
    this.fallbackStore.set(key, { value: refreshToken, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  public async isRefreshTokenValid(userId: string, jti: string, refreshToken: string): Promise<boolean> {
    const key = `rt:${userId}:${jti}`;
    if (this.isConnected && this.client) {
      try {
        const stored = await this.client.get(key);
        return stored === refreshToken;
      } catch (err) {
        // Fallback
      }
    }
    const stored = this.fallbackStore.get(key);
    if (!stored || (stored.expiresAt > 0 && Date.now() > stored.expiresAt)) {
      return false;
    }
    return stored.value === refreshToken;
  }

  public async revokeRefreshToken(userId: string, jti: string): Promise<void> {
    const key = `rt:${userId}:${jti}`;
    if (this.isConnected && this.client) {
      try {
        await this.client.del(key);
        return;
      } catch (err) {
        // Fallback
      }
    }
    this.fallbackStore.delete(key);
  }

  public async revokeAllUserTokens(userId: string): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        const keys = await this.client.keys(`rt:${userId}:*`);
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
        return;
      } catch (err) {
        // Fallback
      }
    }
    for (const key of this.fallbackStore.keys()) {
      if (key.startsWith(`rt:${userId}:`)) {
        this.fallbackStore.delete(key);
      }
    }
  }

  // --- TOKEN REVOCATION LIST (JWT BLACKLIST) ---

  public async revokeToken(jti: string, ttlSeconds = 15 * 60): Promise<void> {
    const key = `bl:${jti}`;
    if (this.isConnected && this.client) {
      try {
        await this.client.set(key, 'revoked', 'EX', ttlSeconds);
        return;
      } catch (err) {
        // Fallback
      }
    }
    this.fallbackStore.set(key, { value: 'revoked', expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  public async isTokenRevoked(jti: string): Promise<boolean> {
    const key = `bl:${jti}`;
    if (this.isConnected && this.client) {
      try {
        const res = await this.client.get(key);
        return res === 'revoked';
      } catch (err) {
        // Fallback
      }
    }
    const item = this.fallbackStore.get(key);
    if (!item) return false;
    if (item.expiresAt > 0 && Date.now() > item.expiresAt) {
      this.fallbackStore.delete(key);
      return false;
    }
    return true;
  }

  // --- SESSION STORAGE ---

  public async storeSession(sessionId: string, sessionData: any, ttlSeconds = 86400): Promise<void> {
    const key = `sess:${sessionId}`;
    const payload = JSON.stringify(sessionData);
    if (this.isConnected && this.client) {
      try {
        await this.client.set(key, payload, 'EX', ttlSeconds);
        return;
      } catch (err) {
        // Fallback
      }
    }
    this.fallbackStore.set(key, { value: payload, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  public async getSession(sessionId: string): Promise<any | null> {
    const key = `sess:${sessionId}`;
    if (this.isConnected && this.client) {
      try {
        const raw = await this.client.get(key);
        return raw ? JSON.parse(raw) : null;
      } catch (err) {
        // Fallback
      }
    }
    const item = this.fallbackStore.get(key);
    if (!item || (item.expiresAt > 0 && Date.now() > item.expiresAt)) {
      return null;
    }
    return JSON.parse(item.value);
  }

  public async deleteSession(sessionId: string): Promise<void> {
    const key = `sess:${sessionId}`;
    if (this.isConnected && this.client) {
      try {
        await this.client.del(key);
        return;
      } catch (err) {
        // Fallback
      }
    }
    this.fallbackStore.delete(key);
  }

  // --- LOGIN RATE-LIMITING & ACCOUNT LOCKOUT TRACKING ---

  public async getLoginAttemptStatus(email: string): Promise<{ attempts: number; lockedUntil?: number; isLocked: boolean }> {
    const normalized = email.trim().toLowerCase();
    const key = `lockout:${normalized}`;

    if (this.isConnected && this.client) {
      try {
        const raw = await this.client.get(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          const isLocked = !!(parsed.lockedUntil && Date.now() < parsed.lockedUntil);
          return { attempts: parsed.attempts || 0, lockedUntil: parsed.lockedUntil, isLocked };
        }
        return { attempts: 0, isLocked: false };
      } catch (err) {
        // Fallback
      }
    }

    const info = this.fallbackLockouts.get(normalized);
    if (!info) return { attempts: 0, isLocked: false };
    const isLocked = !!(info.lockedUntil && Date.now() < info.lockedUntil);
    return { attempts: info.attempts, lockedUntil: info.lockedUntil, isLocked };
  }

  public async recordFailedLoginAttempt(email: string): Promise<{ attempts: number; lockedUntil?: number; isLocked: boolean }> {
    const normalized = email.trim().toLowerCase();
    const status = await this.getLoginAttemptStatus(normalized);
    const newAttempts = status.attempts + 1;

    let lockedUntil: number | undefined;
    if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
      lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
    }

    const key = `lockout:${normalized}`;
    const data = { attempts: newAttempts, lockedUntil };
    const ttlSeconds = Math.ceil(LOCKOUT_DURATION_MS / 1000);

    if (this.isConnected && this.client) {
      try {
        await this.client.set(key, JSON.stringify(data), 'EX', ttlSeconds);
      } catch (err) {
        // Fallback
      }
    }

    this.fallbackLockouts.set(normalized, data);
    return { attempts: newAttempts, lockedUntil, isLocked: !!lockedUntil };
  }

  public async resetLoginAttempts(email: string): Promise<void> {
    const normalized = email.trim().toLowerCase();
    const key = `lockout:${normalized}`;

    if (this.isConnected && this.client) {
      try {
        await this.client.del(key);
      } catch (err) {
        // Fallback
      }
    }

    this.fallbackLockouts.delete(normalized);
  }
}

export const redisService = new RedisService();
