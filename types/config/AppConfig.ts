import type { TagMode } from "@/types/tagging/TagMode";

export interface AppConfig {
  embyUrl: string;
  embyApiKey: string;
  webhookAuth?: string;
  port: number;
  tagName: string;
  tagMode: TagMode;
  tagUsers: string[];
}
