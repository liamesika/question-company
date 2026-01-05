import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import prisma from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-me';
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
const TOKEN_EXPIRY = '7d';
const COOKIE_NAME = 'admin_token';

export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function isEmailWhitelisted(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export async function getAuthCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value || null;
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentAdmin(): Promise<{
  id: string;
  email: string;
  name: string | null;
} | null> {
  const token = await getAuthCookie();
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const admin = await prisma.adminUser.findUnique({
    where: { id: payload.userId, isActive: true },
    select: { id: true, email: true, name: true },
  });

  return admin;
}

export async function authenticateAdmin(
  email: string,
  password: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  // Check whitelist
  if (!isEmailWhitelisted(email)) {
    return { success: false, error: 'Access denied' };
  }

  // Find admin
  const admin = await prisma.adminUser.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!admin || !admin.isActive) {
    return { success: false, error: 'Invalid credentials' };
  }

  // Verify password
  const isValid = await verifyPassword(password, admin.passwordHash);
  if (!isValid) {
    return { success: false, error: 'Invalid credentials' };
  }

  // Update last login
  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });

  // Generate token
  const token = generateToken(admin.id, admin.email);
  return { success: true, token };
}

export async function createAdminUser(
  email: string,
  password: string,
  name?: string
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
    },
  });

  return { success: true };
}
