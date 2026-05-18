import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    this.client = new Redis({
      host: this.config.get<string>('REDIS_HOST', 'localhost'),
      port: this.config.get<number>('REDIS_PORT', 6379),
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    this.client.on('connect', () => this.logger.log('Redis connected'));
    this.client.on('error', (err) => this.logger.error('Redis error', err));

    // Eagerly open the connection so the first request never hits an offline queue
    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  // ─── Core ──────────────────────────────────────────────────────────────────

  /** Get a value. Returns null if missing. */
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  /**
   * Set a value.
   * Pass ttlSeconds to make the key volatile (evictable under volatile-lru policy).
   * Omit ttlSeconds for critical keys (rate limiters, locks) that must never be evicted.
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  /** Delete one or more keys. */
  async del(...keys: string[]): Promise<void> {
    await this.client.del(...keys);
  }

  /** Returns true if the key exists. */
  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1;
  }

  /** Returns remaining TTL in seconds. -1 = no TTL, -2 = key missing. */
  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  /** Reset TTL on an existing key. */
  async expire(key: string, ttlSeconds: number): Promise<void> {
    await this.client.expire(key, ttlSeconds);
  }

  // ─── Counters (rate limiting, OTP attempts) ────────────────────────────────

  /**
   * Atomically increment a counter and return the new value.
   * Keys without TTL are protected from eviction under volatile-lru.
   */
  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  /** Decrement a counter. */
  async decr(key: string): Promise<number> {
    return this.client.decr(key);
  }

  // ─── JSON helpers ──────────────────────────────────────────────────────────

  /** Store any JSON-serialisable value. */
  async setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }

  /** Retrieve and parse a JSON value. Returns null if missing. */
  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  }

  // ─── Health ────────────────────────────────────────────────────────────────

  async ping(): Promise<boolean> {
    try {
      return (await this.client.ping()) === 'PONG';
    } catch {
      return false;
    }
  }
}
