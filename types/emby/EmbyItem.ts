export interface EmbyTagItem {
  Name: string;
  Id?: string;
}

export interface EmbyItem {
  Id: string;
  Name: string;
  TagItems?: EmbyTagItem[];
}

export interface EmbyUser {
  Id: string;
  Name: string;
  Policy?: { IsAdministrator?: boolean };
}
