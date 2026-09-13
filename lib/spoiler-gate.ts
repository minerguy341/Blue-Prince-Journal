import { revealEntries, revealRooms } from "@/lib/catalog";
import type { NotebookPayload, ParsedSave, RevealedEntry } from "@/lib/types";

export function buildRevealedNotebook(
  save: ParsedSave | null,
  extra: Pick<NotebookPayload, "status" | "notes">,
): NotebookPayload {
  if (!save) {
    return {
      ...extra,
      facts: [],
      objectives: [],
      documents: [],
      secrets: [],
      rooms: [],
    };
  }
  const entries = revealEntries(save);
  return {
    ...extra,
    facts: entries.filter((entry) => entry.kind === "fact"),
    objectives: entries.filter((entry) => entry.kind === "objective"),
    documents: entries.filter((entry) => entry.kind === "document"),
    secrets: entries.filter((entry) => entry.kind === "secret"),
    rooms: revealRooms(save),
  };
}

export function catalogTextBlob(entries: RevealedEntry[]): string {
  return entries
    .map((entry) => [entry.id, entry.title, entry.summary, entry.detail, entry.tags.join(" ")].join("\n"))
    .join("\n")
    .toLowerCase();
}
