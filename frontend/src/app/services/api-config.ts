import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';

declare global {
  interface Window {
    __SA3I_CONFIG__?: {
      apiBaseUrl?: string;
    };
  }
}

export function injectApiBaseUrl(): string {
  const platformId = inject(PLATFORM_ID);

  if (isPlatformBrowser(platformId)) {
    return normalizeApiBaseUrl(window.__SA3I_CONFIG__?.apiBaseUrl);
  }

  return normalizeApiBaseUrl(process.env['SA3I_API_BASE_URL']);
}

export function getUploadUrl(photo: string, apiBaseUrl: string): string {
  const trimmedPhoto = photo.trim();

  if (/^(https?:|data:|blob:)/i.test(trimmedPhoto)) {
    return trimmedPhoto;
  }

  if (trimmedPhoto.startsWith('/uploads/')) {
    return `${apiBaseUrl}${trimmedPhoto}`;
  }

  return `${apiBaseUrl}/uploads/${trimmedPhoto}`;
}

function normalizeApiBaseUrl(value: string | undefined): string {
  return (value || 'http://localhost:3000').replace(/\/+$/, '');
}
