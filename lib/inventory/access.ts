import type { ChatGPTUser } from "@/app/chatgpt-auth";

function parseAllowlist(value: string | undefined, normalize: (item: string) => string) {
  return new Set(
    (value ?? "")
      .split(/[\s,;]+/)
      .map((item) => normalize(item.trim()))
      .filter(Boolean),
  );
}

export function inventoryAdminConfigured() {
  return Boolean(process.env.INVENTORY_ADMIN_EMAILS?.trim() || process.env.INVENTORY_ADMIN_USER_IDS?.trim());
}

export function isInventoryAdmin(
  user: Pick<ChatGPTUser, "userId" | "email">,
  configuration: { emails?: string; userIds?: string } = {
    emails: process.env.INVENTORY_ADMIN_EMAILS,
    userIds: process.env.INVENTORY_ADMIN_USER_IDS,
  },
) {
  const emails = parseAllowlist(configuration.emails, (value) => value.toLocaleLowerCase("en"));
  const userIds = parseAllowlist(configuration.userIds, (value) => value);
  return emails.has(user.email.toLocaleLowerCase("en")) || userIds.has(user.userId);
}
