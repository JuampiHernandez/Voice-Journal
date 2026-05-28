export type ShowcaseUser = {
  id: string;
  label: string;
  description: string;
};

/** Pre-seeded journals available on the deployed demo (view-only). */
export const SHOWCASE_USERS: ShowcaseUser[] = [
  {
    id: "demo-user",
    label: "Demo week",
    description: "Sample week of check-ins for a quick tour",
  },
];

export const DEFAULT_SHOWCASE_USER_ID = SHOWCASE_USERS[0]!.id;

export function isShowcaseUserId(userId: string): boolean {
  return SHOWCASE_USERS.some((u) => u.id === userId);
}

export function getShowcaseUser(userId: string): ShowcaseUser | undefined {
  return SHOWCASE_USERS.find((u) => u.id === userId);
}

export function resolveShowcaseUserId(userId: string): string {
  return isShowcaseUserId(userId) ? userId : DEFAULT_SHOWCASE_USER_ID;
}
