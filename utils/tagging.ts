import { appConfig } from "@/config";
import type { SeerrWebhookPayload } from "@/types/seerr/SeerrWebhookPayload";
import { TagMode } from "@/types/tagging/TagMode";

// matches emby user id first, then username
function isListedUser(requesterEmbyUserId?: string, requesterUsername?: string) {
  const { tagUsers } = appConfig;
  const embyUserIdMatch = tagUsers.some((tagUser) => tagUser === requesterEmbyUserId);
  if (embyUserIdMatch) return true;

  const lowerUsername = requesterUsername?.toLowerCase();
  return tagUsers.some((tagUser) => tagUser.toLowerCase() === lowerUsername);
}

// undefined = dont tag
export function pickTagName(payload: SeerrWebhookPayload): string | undefined {
  const { tagMode, tagName } = appConfig;
  const { requesterEmbyUserId, requesterUsername } = payload;
  const listedUser = isListedUser(requesterEmbyUserId, requesterUsername);

  switch (tagMode) {
    case TagMode.ALL:
      return tagName;
    case TagMode.EXCLUDE_USERS:
      return listedUser ? undefined : tagName;
    case TagMode.ONLY_USERS:
      return listedUser ? tagName : undefined;
    case TagMode.REQUESTER:
      return requesterUsername || undefined;
  }
}
