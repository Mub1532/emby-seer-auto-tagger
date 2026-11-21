import type { AppConfig } from "@/types/config/AppConfig";
import { TagMode } from "@/types/tagging/TagMode";

function readRequiredEnv(envName: string) {
  const envValue = process.env[envName];
  if (!envValue) throw new Error(`missing env ${envName}`);
  return envValue;
}

function readTagMode() {
  const tagModeValue = process.env.TAG_MODE?.toUpperCase() ?? TagMode.EXCLUDE_USERS;
  const tagMode = Object.values(TagMode).find((mode) => mode === tagModeValue);
  if (tagMode === undefined) throw new Error(`unknown TAG_MODE ${tagModeValue}, use ${Object.values(TagMode).join(" / ")}`);
  return tagMode;
}

function readTagUsers() {
  return (process.env.TAG_USERS ?? "")
    .split(",")
    .map((tagUser) => tagUser.trim())
    .filter((tagUser) => tagUser.length);
}

export const appConfig: AppConfig = {
  embyUrl: readRequiredEnv("EMBY_URL").replace(/\/+$/, ""),
  embyApiKey: readRequiredEnv("EMBY_API_KEY"),
  webhookAuth: process.env.WEBHOOK_AUTH || undefined,
  port: Number(process.env.PORT) || 3000,
  tagName: process.env.TAG_NAME || "shared-stuff",
  tagMode: readTagMode(),
  tagUsers: readTagUsers(),
};
