export interface SeerrWebhookPayload {
  notificationType: string;
  mediaType: string;
  embyItemId?: string;
  tmdbId?: string;
  tvdbId?: string;
  requesterEmbyUserId?: string;
  requesterUsername?: string;
}
