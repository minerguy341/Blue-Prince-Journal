export type SaveSource = "es3" | "json" | "demo";

export type SnapshotId = "starter" | "day59" | "live";

export type TabId =
  | "index"
  | "objectives"
  | "documents"
  | "secrets"
  | "rooms"
  | "notes"
  | "settings";

export type EntryKind = "document" | "secret" | "objective" | "fact";

export type ParsedSave = {
  fingerprint: string;
  slot: string;
  source: SaveSource;
  fileName: string;
  path: string;
  mtime: string | null;
  saveCreated: string | null;
  gameVersion: string | null;
  day: number;
  allowance: number;
  flags: Record<string, boolean>;
  numbers: Record<string, number>;
  strings: Record<string, string>;
  rooms: Record<string, number>;
  rarity: Record<string, number>;
};

export type RevealedEntry = {
  id: string;
  kind: EntryKind;
  title: string;
  summary: string;
  detail: string;
  tags: string[];
  complete?: boolean;
};

export type RoomEntry = {
  name: string;
  count: number;
  rarity: number;
  category: string;
};

export type CustomNote = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  pinned: boolean;
  linkedEntryId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NotebookStatus = {
  watching: boolean;
  useDemo: boolean;
  snapshot: SnapshotId;
  watchPath: string;
  resolvedPath: string;
  lastSync: string | null;
  source: SaveSource | null;
  fileName: string | null;
  day: number | null;
  allowance: number | null;
  fingerprint: string | null;
  error: string | null;
  live: boolean;
};

export type Settings = {
  snapshot: SnapshotId;
  useDemo: boolean;
  watchPath: string;
};

export type NotebookPayload = {
  status: NotebookStatus;
  facts: RevealedEntry[];
  objectives: RevealedEntry[];
  documents: RevealedEntry[];
  secrets: RevealedEntry[];
  rooms: RoomEntry[];
  notes: CustomNote[];
};
