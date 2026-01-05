import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDeviceType(userAgent: string): string {
  if (/mobile/i.test(userAgent)) return 'mobile';
  if (/tablet|ipad/i.test(userAgent)) return 'tablet';
  return 'desktop';
}

export function formatTimestamp(): string {
  return new Date().toISOString();
}

export async function getClientInfo(): Promise<{
  ip: string;
  country: string;
  deviceType: string;
  userAgent: string;
}> {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();

    return {
      ip: data.ip || 'unknown',
      country: data.country_name || 'unknown',
      deviceType: getDeviceType(navigator.userAgent),
      userAgent: navigator.userAgent,
    };
  } catch {
    return {
      ip: 'unknown',
      country: 'unknown',
      deviceType: getDeviceType(navigator.userAgent),
      userAgent: navigator.userAgent,
    };
  }
}

export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
