import { db } from '../models/db';
import { users } from '../models/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import * as crypto from 'crypto';

export interface User {
  id: string;
  email?: string;
  name?: string;
  username?: string;
  passwordHash?: string;
  createdAt: Date;
}

export class UserService {
  private readonly ENCRYPTION_KEY: Buffer;
  private readonly ALGORITHM = 'aes-256-gcm';
  private readonly IV_LENGTH = 16;
  private readonly AUTH_TAG_LENGTH = 16;

  constructor() {
    // In production, this should come from environment variables
    // For now, we'll generate a consistent key based on a secret
    const secret = process.env.ENCRYPTION_SECRET || 'velocity-banking-secret-key-change-in-production';
    this.ENCRYPTION_KEY = crypto.scryptSync(secret, 'salt', 32);
  }

  /**
   * Encrypts sensitive user data for storage
   */
  private encrypt(text: string): string {
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipheriv(this.ALGORITHM, this.ENCRYPTION_KEY, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Combine IV + authTag + encrypted data
    return iv.toString('hex') + authTag.toString('hex') + encrypted;
  }

  /**
   * Decrypts sensitive user data
   */
  private decrypt(encryptedData: string): string {
    const ivHex = encryptedData.slice(0, this.IV_LENGTH * 2);
    const authTagHex = encryptedData.slice(this.IV_LENGTH * 2, (this.IV_LENGTH + this.AUTH_TAG_LENGTH) * 2);
    const encrypted = encryptedData.slice((this.IV_LENGTH + this.AUTH_TAG_LENGTH) * 2);

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(this.ALGORITHM, this.ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Generates a privacy-preserving user identifier
   * Uses a hash of the email to create a consistent but anonymous ID
   */
  private generateUserId(email: string): string {
    const hash = crypto.createHash('sha256');
    hash.update(email.toLowerCase().trim());
    return hash.digest('hex').substring(0, 32);
  }

  /**
   * Creates or retrieves a user based on email
   * Email is encrypted for privacy
   */
  async getOrCreateUser(email: string, name: string): Promise<User> {
    const userId = this.generateUserId(email);

    // Check if user exists
    const existing = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (existing.length > 0) {
      return {
        id: existing[0].id,
        email: existing[0].email ? this.decrypt(existing[0].email) : undefined,
        name: existing[0].name ? this.decrypt(existing[0].name) : undefined,
        createdAt: existing[0].createdAt,
      };
    }

    // Create new user with encrypted data
    const now = new Date();
    const user = {
      id: userId,
      email: this.encrypt(email.toLowerCase().trim()),
      name: this.encrypt(name.trim()),
      createdAt: now,
    };

    await db.insert(users).values(user);

    return {
      id: userId,
      email: email,
      name: name,
      createdAt: now,
    };
  }

  /**
   * Retrieves a user by their ID
   */
  async getUser(userId: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (result.length === 0) {
      return null;
    }

    return {
      id: result[0].id,
      email: result[0].email ? this.decrypt(result[0].email) : undefined,
      name: result[0].name ? this.decrypt(result[0].name) : undefined,
      createdAt: result[0].createdAt,
    };
  }

  /**
   * Updates user information
   */
  async updateUser(userId: string, data: { email?: string; name?: string }): Promise<User | null> {
    const updates: any = {
      updatedAt: new Date(),
    };

    if (data.email) {
      updates.email = this.encrypt(data.email.toLowerCase().trim());
    }

    if (data.name) {
      updates.name = this.encrypt(data.name.trim());
    }

    await db.update(users).set(updates).where(eq(users.id, userId));

    return this.getUser(userId);
  }

  /**
   * Validates user ID format
   */
  isValidUserId(userId: string): boolean {
    return /^[a-f0-9]{32}$/.test(userId);
  }

  /**
   * Generates a user ID from email (for client-side use)
   */
  getUserIdFromEmail(email: string): string {
    return this.generateUserId(email);
  }

  /**
   * Creates a user with username and password
   */
  async createUserWithPassword(username: string, passwordHash: string): Promise<User> {
    const userId = randomUUID();
    const now = new Date();

    const user = {
      id: userId,
      username: username,
      email: null,
      name: null,
      passwordHash: passwordHash,
      createdAt: now,
    };

    await db.insert(users).values(user);

    return {
      id: userId,
      username: username,
      createdAt: now,
    };
  }

  /**
   * Retrieves a user by username
   */
  async getUserByUsername(username: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);

    if (result.length === 0) {
      return null;
    }

    return {
      id: result[0].id,
      username: result[0].username || undefined,
      passwordHash: result[0].passwordHash || undefined,
      createdAt: result[0].createdAt,
    };
  }
}
