export type ProvisionUserFromSuperTokensInput = {
  authUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
};

export type CompleteSocialSignupInput = {
  firstName?: string;
  lastName?: string;
};