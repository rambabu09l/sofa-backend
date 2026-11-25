import {
  AVATAR_URL_PROTOCOLS,
  MAX_AVATAR_URL_LENGTH,
} from '../constants/social-provider-profile.constants';
import type {
  ProviderUserInfo,
  SocialIdentityNames,
} from '../types/provider-user-info.types';

export function stringMeta(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** Accept only absolute http(s) URLs that fit `users.avatar_url`. */
export function sanitizeAvatarUrl(value: unknown): string | null {
  const url = stringMeta(value);
  if (!url || url.length > MAX_AVATAR_URL_LENGTH) {
    return null;
  }
  try {
    const parsed = new URL(url);
    if (
      !(AVATAR_URL_PROTOCOLS as readonly string[]).includes(parsed.protocol)
    ) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

/** Google uses `picture`; other providers may send `avatar_url` / `photo`. */
export function readProviderAvatarUrl(raw: ProviderUserInfo): string | null {
  const api = raw.fromUserInfoAPI ?? {};
  const idToken = raw.fromIdTokenPayload ?? {};
  return (
    sanitizeAvatarUrl(api.picture) ??
    sanitizeAvatarUrl(idToken.picture) ??
    sanitizeAvatarUrl(api.avatar_url) ??
    sanitizeAvatarUrl(api.photo) ??
    sanitizeAvatarUrl(idToken.avatar_url) ??
    null
  );
}

export function readProviderNames(raw: ProviderUserInfo): SocialIdentityNames {
  const api = raw.fromUserInfoAPI ?? {};
  const idToken = raw.fromIdTokenPayload ?? {};
  const given =
    stringMeta(api.given_name) ||
    stringMeta(idToken.given_name) ||
    stringMeta(api.first_name);
  const family =
    stringMeta(api.family_name) ||
    stringMeta(idToken.family_name) ||
    stringMeta(api.last_name);

  if (given || family) {
    return { firstName: given, lastName: family };
  }

  const full =
    stringMeta(api.name) || stringMeta(idToken.name) || stringMeta(api.full_name);
  if (!full) {
    return { firstName: '', lastName: '' };
  }
  const [first, ...rest] = full.split(/\s+/);
  return { firstName: first ?? '', lastName: rest.join(' ') };
}
