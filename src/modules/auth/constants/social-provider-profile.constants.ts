/** Matches `users.avatar_url` VARCHAR(2048). */
export const MAX_AVATAR_URL_LENGTH = 2048;

/** Protocols allowed for provider profile photo URLs. */
export const AVATAR_URL_PROTOCOLS = ['https:', 'http:'] as const;

/** SuperTokens UserMetadata keys written from social providers. */
export const SOCIAL_USER_METADATA_KEYS = {
  firstName: 'first_name',
  lastName: 'last_name',
  avatarUrl: 'avatar_url',
} as const;

/** Fallback display first name when Google sends neither name nor email local-part. */
export const SOCIAL_FALLBACK_FIRST_NAME = 'User';
