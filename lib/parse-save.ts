import { createHash } from "node:crypto";

import { decodeSaveBytes } from "@/lib/es3";
import type { ParsedSave, SaveSource } from "@/lib/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function unwrap(value: unknown): unknown {
  if (isRecord(value) && "value" in value) {
    return value.value;
  }
  return value;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return null;
}

function flattenObjs(objs: unknown): Record<string, unknown> {
  const raw = unwrap(objs);
  if (!isRecord(raw)) return {};
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    out[key] = unwrap(value);
  }
  return out;
}

function pickSlot(root: Record<string, unknown>): { slot: string; objs: Record<string, unknown> } {
  const blueprint = unwrap(root.BluePrint) ?? unwrap(root.Blueprint);
  if (isRecord(blueprint)) {
    const objs = flattenObjs(blueprint.objs ?? blueprint);
    if (Object.keys(objs).length) return { slot: "BluePrint", objs };
  }
  if (isRecord(root.objs)) {
    return { slot: "BluePrint", objs: flattenObjs(root.objs) };
  }
  return { slot: "BluePrint", objs: flattenObjs(root) };
}

function asCountMap(value: unknown): Record<string, number> {
  const inner = unwrap(value);
  const out: Record<string, number> = {};
  if (Array.isArray(inner)) {
    for (const item of inner) {
      if (!isRecord(item)) continue;
      const name = String(unwrap(item.name) ?? unwrap(item.Name) ?? unwrap(item.room) ?? "");
      const count = asNumber(unwrap(item.count) ?? unwrap(item.Count) ?? unwrap(item.value));
      if (name && count !== null) out[name.toUpperCase()] = count;
    }
    return out;
  }
  if (isRecord(inner)) {
    if (isRecord(inner.objs)) return asCountMap(inner.objs);
    for (const [key, raw] of Object.entries(inner)) {
      const count = asNumber(unwrap(raw));
      if (count !== null) out[key.toUpperCase()] = count;
    }
  }
  return out;
}

function classify(objs: Record<string, unknown>): Pick<ParsedSave, "flags" | "numbers" | "strings"> {
  const flags: Record<string, boolean> = {};
  const numbers: Record<string, number> = {};
  const strings: Record<string, string> = {};
  for (const [key, value] of Object.entries(objs)) {
    if (typeof value === "boolean") {
      if (value) flags[key] = true;
      continue;
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      numbers[key] = value;
      continue;
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed === "true") flags[key] = true;
      else if (trimmed && trimmed !== "false") strings[key] = value;
    }
  }
  return { flags, numbers, strings };
}

export function fingerprintSave(slot: string, saveCreated: string | null, extra = ""): string {
  return createHash("sha256")
    .update(`${slot}|${saveCreated ?? "unknown"}|${extra}`)
    .digest("hex")
    .slice(0, 16);
}

export function parseSaveDocument(
  document: unknown,
  info: { path: string; fileName: string; mtime: string | null; source: SaveSource },
): ParsedSave {
  const root = unwrap(document);
  if (!isRecord(root)) {
    throw new Error("Save file did not contain an object");
  }
  const source: SaveSource =
    info.source === "demo" || root.source === "demo" ? "demo" : info.source;
  const { slot, objs } = pickSlot(root);
  const classified = classify(objs);
  const rooms = asCountMap(root.RoomRecords ?? root.rooms ?? objs.RoomRecords);
  const rarity = asCountMap(root.RarityShifts ?? root.rarity ?? objs.RarityShifts);
  const saveCreated =
    (typeof root.save_created === "string" && root.save_created) ||
    classified.strings.save_created ||
    null;
  const gameVersion =
    (typeof root.game_version === "string" && root.game_version) ||
    classified.strings.game_version ||
    null;
  const extra =
    root.snapshot === "starter" ? "starter" : source === "demo" ? "demo" : "";
  const day = classified.numbers.DAY ?? 0;
  const allowance = classified.numbers.allowance ?? 0;
  return {
    fingerprint: fingerprintSave(slot, saveCreated, extra),
    slot,
    source,
    fileName: info.fileName,
    path: info.path,
    mtime: info.mtime,
    saveCreated,
    gameVersion,
    day,
    allowance,
    flags: classified.flags,
    numbers: classified.numbers,
    strings: classified.strings,
    rooms,
    rarity,
  };
}

export function parseSaveBytes(
  bytes: Buffer,
  info: { path: string; fileName: string; mtime: string | null; source?: SaveSource },
): ParsedSave {
  const source: SaveSource =
    info.source ?? (info.fileName.toLowerCase().endsWith(".es3") ? "es3" : "json");
  return parseSaveDocument(decodeSaveBytes(bytes), { ...info, source });
}
