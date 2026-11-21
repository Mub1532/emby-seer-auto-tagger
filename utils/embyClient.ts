import { appConfig } from "@/config";
import type { EmbyItem, EmbyUser } from "@/types/emby/EmbyItem";

export default class EmbyClient {
  private adminUserId?: string;

  private async embyFetch(path: string, init?: RequestInit) {
    const { embyUrl, embyApiKey } = appConfig;
    const response = await fetch(`${embyUrl}/emby/${path}`, {
      ...init,
      headers: { "X-Emby-Token": embyApiKey, "Content-Type": "application/json", ...init?.headers },
    });
    if (!response.ok) throw new Error(`emby ${init?.method ?? "GET"} ${path} failed with ${response.status}`);
    return response;
  }

  // full item edits need a user scoped read, so use any admin
  private async getAdminUserId() {
    if (this.adminUserId) return this.adminUserId;

    const embyUsers: EmbyUser[] = await (await this.embyFetch("Users")).json();
    const adminUser = embyUsers.find((embyUser) => embyUser.Policy?.IsAdministrator);
    if (!adminUser) throw new Error("no admin user found in emby");

    this.adminUserId = adminUser.Id;
    return adminUser.Id;
  }

  async findItemByProviderId(providerName: string, providerId: string): Promise<string | undefined> {
    const searchParams = new URLSearchParams({
      Recursive: "true",
      AnyProviderIdEquals: `${providerName}.${providerId}`,
      IncludeItemTypes: "Movie,Series",
    });
    const { Items: foundItems }: { Items: EmbyItem[] } = await (await this.embyFetch(`Items?${searchParams}`)).json();
    return foundItems[0]?.Id;
  }

  // returns false if the item already had the tag
  async addTag(itemId: string, tagName: string): Promise<boolean> {
    const adminUserId = await this.getAdminUserId();
    const embyItem: EmbyItem = await (await this.embyFetch(`Users/${adminUserId}/Items/${itemId}`)).json();
    const currentTags = embyItem.TagItems ?? [];

    if (currentTags.some((tagItem) => tagItem.Name.toLowerCase() === tagName.toLowerCase())) return false;

    const taggedItem = { ...embyItem, TagItems: [...currentTags, { Name: tagName }] };
    await this.embyFetch(`Items/${itemId}`, { method: "POST", body: JSON.stringify(taggedItem) });
    return true;
  }
}
