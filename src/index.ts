import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { appConfig } from "@/config";
import type { SeerrWebhookPayload } from "@/types/seerr/SeerrWebhookPayload";
import EmbyClient from "@/utils/embyClient";
import { pickTagName } from "@/utils/tagging";

const embyClient = new EmbyClient();

async function readBody(request: IncomingMessage) {
  let body = "";
  for await (const chunk of request) body += chunk;
  return body;
}

function reply(response: ServerResponse, statusCode: number, message: string) {
  response.writeHead(statusCode, { "Content-Type": "text/plain" });
  response.end(message);
}

async function findEmbyItemId(payload: SeerrWebhookPayload) {
  const { embyItemId, mediaType, tmdbId, tvdbId } = payload;
  if (embyItemId) return embyItemId;

  // fallback if seerr didnt send the emby id
  if (tmdbId) {
    const tmdbMatch = await embyClient.findItemByProviderId("tmdb", tmdbId);
    if (tmdbMatch) return tmdbMatch;
  }
  if (mediaType === "tv" && tvdbId) return embyClient.findItemByProviderId("tvdb", tvdbId);
}

async function tagAvailableMedia(payload: SeerrWebhookPayload) {
  const { requesterUsername, tmdbId } = payload;
  const tagName = pickTagName(payload);
  if (!tagName) {
    console.log(`skipped tmdb ${tmdbId}, requested by ${requesterUsername}`);
    return;
  }

  const embyItemId = await findEmbyItemId(payload);
  if (!embyItemId) {
    console.warn(`couldnt find tmdb ${tmdbId} in emby`);
    return;
  }

  const tagAdded = await embyClient.addTag(embyItemId, tagName);
  console.log(`${tagAdded ? "tagged" : "already tagged"} ${embyItemId} as ${tagName}, requested by ${requesterUsername}`);
}

async function handleWebhook(request: IncomingMessage, response: ServerResponse) {
  const { webhookAuth } = appConfig;
  if (request.method !== "POST" || request.url !== "/webhook") return reply(response, 404, "not found");
  if (webhookAuth && request.headers.authorization !== webhookAuth) return reply(response, 401, "unauthorized");

  let payload: SeerrWebhookPayload;
  try {
    payload = JSON.parse(await readBody(request));
  } catch {
    return reply(response, 400, "bad json");
  }

  const { notificationType } = payload;
  if (notificationType === "TEST_NOTIFICATION") {
    console.log("got seerr test notification");
    return reply(response, 200, "ok");
  }
  if (notificationType !== "MEDIA_AVAILABLE") return reply(response, 200, "ignored");

  // reply straight away so seerr isnt left waiting on emby
  reply(response, 200, "ok");
  try {
    await tagAvailableMedia(payload);
  } catch (error) {
    console.error("tagging failed", error);
  }
}

const { port, tagMode, tagName, tagUsers } = appConfig;
createServer((request, response) => handleWebhook(request, response)).listen(port, () =>
  console.log(`listening on ${port}, mode ${tagMode}, tag ${tagName}, users ${tagUsers.join(", ") || "none"}`),
);
