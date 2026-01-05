import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import prisma from './prisma';
import { logger } from './logger';

// Environment validation
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET || process.env.JWT_SECRET;
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set and at least 32 characters');
}

if (ADMIN_EMAILS.length === 0) {
  throw new Error('ADMIN_EMAILS must be set with at least one email');
}

// Token configuration
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const ACCESS_COOKIE_NAME = 'admin_access_token';
const REFRESH_COOKIE_NAME = 'admin_refresh_token';

// Rate limiting configuration
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;
const RATE_LIMIT_WINDOW_MINUTES = 15;
const MAX_ATTEMPTS_PER_IP = 10;

export interface JWTPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}

export interface AdminInfo {
  id: string;
  email: string;
  name: string | null;
  mustResetPassword: boolean;
}

// Password utilities
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateSecurePassword(length: number = 24): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const randomBytes = crypto.randomBytes(length);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }
  return password;
}

export function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
  if (password.length < 12) {
    return { valid: false, error: 'Password must be at least 12 characters' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain lowercase letters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain uppercase letters' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain numbers' };
  }
  return { valid: true };
}

// Token generation
export function generateAccessToken(userId: string, email: string): string {
  return jwt.sign({ userId, email, type: 'access' }, JWT_SECRET!, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export function generateRefreshTokenValue(): string {
  return crypto.randomBytes(64).toString('hex');
}

export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET!) as JWTPayload;
    if (payload.type !== 'access') return null;
    return payload;
  } catch {
    return null;
  }
}

export function isEmailWhitelisted(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

// Cookie management
export async function setAuthCookies(accessToken: string, refreshToken: string): Promise<void> {
  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === 'production';

  cookieStore.set(ACCESS_COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 15 * 60, // 15 minutes
    path: '/',
  });

  cookieStore.set(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * REFRESH_TOKEN_EXPIRY_DAYS,
    path: '/',
  });
}

export async function getAuthCookies(): Promise<{ accessToken: string | null; refreshToken: string | null }> {
  const cookieStore = await cookies();
  return {
    accessToken: cookieStore.get(ACCESS_COOKIE_NAME)?.value || null,
    refreshToken: cookieStore.get(REFRESH_COOKIE_NAME)?.value || null,
  };
}

export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_COOKIE_NAME);
  cookieStore.delete(REFRESH_COOKIE_NAME);
}

// Rate limiting
export async function checkRateLimit(ip: string, email: string): Promise<{ allowed: boolean; error?: string }> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);

  // Check IP-based rate limit
  const ipAttempts = await prisma.loginAttempt.count({
    where: {
      ip,
      createdAt: { gte: windowStart },
    },
  });

  if (ipAttempts >= MAX_ATTEMPTS_PER_IP) {
    return { allowed: false, error: 'Too many login attempts. Please try again later.' };
  }

  // Check if account is locked
  const admin = await prisma.adminUser.findUnique({
    where: { email: email.toLowerCase() },
    select: { lockedUntil: true, failedLoginAttempts: true },
  });

  if (admin?.lockedUntil && admin.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((admin.lockedUntil.getTime() - Date.now()) / 60000);
    return { allowed: false, error: `Account locked. Try again in ${minutesLeft} minutes.` };
  }

  return { allowed: true };
}

export async function recordLoginAttempt(
  ip: string,
  email: string,
  success: boolean,
  userAgent?: string
): Promise<void> {
  await prisma.loginAttempt.create({
    data: { ip, email: email.toLowerCase(), success, userAgent },
  });

  if (!success) {
    const admin = await prisma.adminUser.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (admin) {
      const newAttempts = admin.failedLoginAttempts + 1;
      const shouldLock = newAttempts >= MAX_LOGIN_ATTEMPTS;

      await prisma.adminUser.update({
        where: { id: admin.id },
        data: {
          failedLoginAttempts: newAttempts,
          lockedUntil: shouldLock
            ? new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000)
            : null,
        },
      });

      if (shouldLock) {
        logger.warn('Account locked due to failed attempts', { email, attempts: newAttempts });
      }
    }
  } else {
    // Reset failed attempts on successful login
    await prisma.adminUser.update({
      where: { email: email.toLowerCase() },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  }
}

// Session management
export async function getCurrentAdmin(): Promise<AdminInfo | null> {
  const { accessToken, refreshToken } = await getAuthCookies();

  // Try access token first
  if (accessToken) {
    const payload = verifyAccessToken(accessToken);
    if (payload) {
      const admin = await prisma.adminUser.findUnique({
        where: { id: payload.userId, isActive: true },
        select: { id: true, email: true, name: true, mustResetPassword: true },
      });
      return admin;
    }
  }

  // Try refresh token
  if (refreshToken) {
    const refreshed = await refreshAccessToken(refreshToken);
    if (refreshed) {
      return refreshed.admin;
    }
  }

  return null;
}

export async function refreshAccessToken(
  refreshTokenValue: string
): Promise<{ admin: AdminInfo; newAccessToken: string } | null> {
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshTokenValue },
    include: { admin: true },
  });

  if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
    return null;
  }

  if (!storedToken.admin.isActive) {
    return null;
  }

  // Generate new access token
  const newAccessToken = generateAccessToken(storedToken.admin.id, storedToken.admin.email);

  // Update cookie
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_COOKIE_NAME, newAccessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60,
    path: '/',
  });

  return {
    admin: {
      id: storedToken.admin.id,
      email: storedToken.admin.email,
      name: storedToken.admin.name,
      mustResetPassword: storedToken.admin.mustResetPassword,
    },
    newAccessToken,
  };
}

// Authentication
export async function authenticateAdmin(
  email: string,
  password: string,
  ip: string,
  userAgent?: string
): Promise<{ success: boolean; accessToken?: string; refreshToken?: string; mustResetPassword?: boolean; error?: string }> {
  // Check rate limit
  const rateLimit = await checkRateLimit(ip, email);
  if (!rateLimit.allowed) {
    return { success: false, error: rateLimit.error };
  }

  // Check whitelist
  if (!isEmailWhitelisted(email)) {
    await recordLoginAttempt(ip, email, false, userAgent);
    logger.warn('Login attempt with non-whitelisted email', { email, ip });
    return { success: false, error: 'Access denied' };
  }

  // Find admin
  const admin = await prisma.adminUser.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!admin || !admin.isActive) {
    await recordLoginAttempt(ip, email, false, userAgent);
    return { success: false, error: 'Invalid credentials' };
  }

  // Verify password
  const isValid = await verifyPassword(password, admin.passwordHash);
  if (!isValid) {
    await recordLoginAttempt(ip, email, false, userAgent);
    return { success: false, error: 'Invalid credentials' };
  }

  // Record successful login
  await recordLoginAttempt(ip, email, true, userAgent);

  // Generate tokens
  const accessToken = generateAccessToken(admin.id, admin.email);
  const refreshTokenValue = generateRefreshTokenValue();

  // Store refresh token
  await prisma.refreshToken.create({
    data: {
      token: refreshTokenValue,
      adminId: admin.id,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    },
  });

  // Update last login
  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });

  logger.info('Admin login successful', { email, ip });

  return {
    success: true,
    accessToken,
    refreshToken: refreshTokenValue,
    mustResetPassword: admin.mustResetPassword,
  };
}

// Logout
export async function logoutAdmin(): Promise<void> {
  const { refreshToken } = await getAuthCookies();

  if (refreshToken) {
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revokedAt: new Date() },
    });
  }

  await clearAuthCookies();
}

// Password reset
export async function resetPassword(
  adminId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const admin = await prisma.adminUser.findUnique({
    where: { id: adminId },
  });

  if (!admin) {
    return { success: false, error: 'Admin not found' };
  }

  // Verify current password
  const isValid = await verifyPassword(currentPassword, admin.passwordHash);
  if (!isValid) {
    return { success: false, error: 'Current password is incorrect' };
  }

  // Validate new password
  const validation = validatePasswordStrength(newPassword);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // Update password
  const newHash = await hashPassword(newPassword);
  await prisma.adminUser.update({
    where: { id: adminId },
    data: {
      passwordHash: newHash,
      mustResetPassword: false,
    },
  });

  // Revoke all existing refresh tokens
  await prisma.refreshToken.updateMany({
    where: { adminId },
    data: { revokedAt: new Date() },
  });

  logger.info('Password reset successful', { adminId });

  return { success: true };
}

// Admin user creation (for seed)
export async function createAdminUser(
  email: string,
  password: string,
  name?: string,
  mustResetPassword: boolean = true
): Promise<{ success: boolean; error?: string }> {
  if (!isEmailWhitelisted(email)) {
    return { success: false, error: 'Email not whitelisted' };
  }

  const existing = await prisma.adminUser.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existing) {
    return { success: false, error: 'Admin already exists' };
  }

  const passwordHash = await hashPassword(password);

  await prisma.adminUser.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      name,
      mustResetPassword,
    },
  });

  return { success: true };
}
