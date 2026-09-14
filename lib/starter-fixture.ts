import { createHash } from "node:crypto";

import type { ParsedSave } from "@/lib/types";

export const STARTER_TRUE_FLAGS = [
  "Load Complete",
  "PickedupBluePrint",
] as const;

export const STARTER_NUMBERS: Record<string, number> = {
  DAY: 1,
  allowance: 2,
  SaveSlot: 1,
  TotalRooms: 4,
};

export const STARTER_ROOMS: Record<string, number> = {
  "ENTRANCE HALL": 1,
  HALLWAY: 1,
  BEDROOM: 1,
  CLOSET: 1,
};

export const STARTER_META = {
  slot: "BluePrint",
  saveCreated: "2026-04-10T08:15:00",
  gameVersion: "1.1.10.25",
  fileName: "blueprint-export.json",
};

export function starterFingerprint(): string {
  return createHash("sha256")
    .update(`${STARTER_META.slot}|${STARTER_META.saveCreated}|starter`)
    .digest("hex")
    .slice(0, 16);
}

export function buildStarterSave(
  path = "data/starter-storage/blueprint-export.json",
): ParsedSave {
  const flags: Record<string, boolean> = {};
  for (const name of STARTER_TRUE_FLAGS) flags[name] = true;
  return {
    fingerprint: starterFingerprint(),
    slot: STARTER_META.slot,
    source: "demo",
    fileName: STARTER_META.fileName,
    path,
    mtime: new Date().toISOString(),
    saveCreated: STARTER_META.saveCreated,
    gameVersion: STARTER_META.gameVersion,
    day: STARTER_NUMBERS.DAY,
    allowance: STARTER_NUMBERS.allowance,
    flags,
    numbers: { ...STARTER_NUMBERS },
    strings: {},
    rooms: { ...STARTER_ROOMS },
    rarity: {},
  };
}

export function starterExportJson(): Record<string, unknown> {
  const objs: Record<string, unknown> = { ...STARTER_NUMBERS };
  for (const name of STARTER_TRUE_FLAGS) objs[name] = true;
  return {
    source: "demo",
    snapshot: "starter",
    slot: STARTER_META.slot,
    save_created: STARTER_META.saveCreated,
    game_version: STARTER_META.gameVersion,
    BluePrint: {
      value: { objs },
    },
    RoomRecords: STARTER_ROOMS,
    RarityShifts: {},
  };
}

export const STARTER_MORNING_NOTE = {
  id: "note-morning-one",
  title: "Morning one",
  body: `Entrance Hall first. Three doors.

I drafted a hallway, then a bedroom, then a closet. Writing rooms down as I go.`,
  tags: ["day-1", "morning"],
  pinned: true,
  linkedEntryId: null as string | null,
};
