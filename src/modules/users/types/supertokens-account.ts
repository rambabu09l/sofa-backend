/** App profile fields created after SuperTokens EmailPassword / social signup. */
export type SuperTokensAccount = {
  authUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  /** Set for Google (etc.) when the provider returns a profile photo URL. */
  avatarUrl?: string | null;
};
