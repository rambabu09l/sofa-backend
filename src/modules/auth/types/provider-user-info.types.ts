/** Raw profile payload SuperTokens returns from a ThirdParty provider (e.g. Google). */
export type ProviderUserInfo = {
  fromIdTokenPayload?: { [key: string]: unknown };
  fromUserInfoAPI?: { [key: string]: unknown };
};

export type SocialIdentityNames = {
  firstName: string;
  lastName: string;
};

export type SocialIdentity = SocialIdentityNames & {
  email: string;
  /** Provider profile photo URL when present (e.g. Google `picture`). */
  avatarUrl: string | null;
};
