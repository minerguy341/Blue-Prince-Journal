import fs from "node:fs";
import path from "node:path";

import { DEMO_CHESS_NOTE, demoFingerprint } from "@/lib/demo-fixture";
import { STARTER_MORNING_NOTE, starterFingerprint } from "@/lib/starter-fixture";
import { NOTES_DIR, ensureDataDirs } from "@/lib/paths";
import type { CustomNote } from "@/lib/types";

type NotesFile = {
  seeded: boolean;
  notes: CustomNote[];
};

function filePath(fingerprint: string): string {
  return path.join(NOTES_DIR, `${fingerprint}.json`);
}

function nowIso(): string {
  return new Date().toISOString();
}

function seedFor(fingerprint: string): CustomNote[] {
  const stamp = nowIso();
  if (fingerprint === starterFingerprint()) {
    return [{ ...STARTER_MORNING_NOTE, createdAt: stamp, updatedAt: stamp }];
  }
  if (fingerprint === demoFingerprint()) {
    return [{ ...DEMO_CHESS_NOTE, createdAt: stamp, updatedAt: stamp }];
  }
  return [];
}

export function readNotes(fingerprint: string): CustomNote[] {
  ensureDataDirs();
  const target = filePath(fingerprint);
  if (!fs.existsSync(target)) {
    const notes = seedFor(fingerprint);
    writeNotesFile(fingerprint, { seeded: true, notes });
    return notes;
  }
  const parsed = JSON.parse(fs.readFileSync(target, "utf8")) as NotesFile;
  return Array.isArray(parsed.notes) ? parsed.notes : [];
}

function writeNotesFile(fingerprint: string, file: NotesFile) {
  ensureDataDirs();
  fs.writeFileSync(filePath(fingerprint), JSON.stringify(file, null, 2));
}

export function saveNotes(fingerprint: string, notes: CustomNote[]) {
  writeNotesFile(fingerprint, { seeded: true, notes });
  return notes;
}

export function upsertNote(fingerprint: string, patch: Partial<CustomNote> & { id?: string }): CustomNote {
  const notes = readNotes(fingerprint);
  const stamp = nowIso();
  if (patch.id) {
    const index = notes.findIndex((note) => note.id === patch.id);
    if (index === -1) throw new Error("Note not found");
    const next = {
      ...notes[index],
      ...patch,
      id: notes[index].id,
      updatedAt: stamp,
    };
    notes[index] = next;
    saveNotes(fingerprint, notes);
    return next;
  }
  const created: CustomNote = {
    id: `note-${Math.random().toString(36).slice(2, 10)}`,
    title: patch.title?.trim() || "Untitled note",
    body: patch.body ?? "",
    tags: patch.tags ?? [],
    pinned: Boolean(patch.pinned),
    linkedEntryId: patch.linkedEntryId ?? null,
    createdAt: stamp,
    updatedAt: stamp,
  };
  notes.unshift(created);
  saveNotes(fingerprint, notes);
  return created;
}

export function deleteNote(fingerprint: string, id: string): boolean {
  const notes = readNotes(fingerprint);
  const next = notes.filter((note) => note.id !== id);
  if (next.length === notes.length) return false;
  saveNotes(fingerprint, next);
  return true;
}
