import fs from "node:fs";
import path from "node:path";

import chokidar from "chokidar";

import { buildDemoSave, demoExportJson } from "@/lib/demo-fixture";
import { readNotes } from "@/lib/notes-store";
import {
  DEMO_DIR,
  DEMO_EXPORT_PATH,
  STARTER_DIR,
  STARTER_EXPORT_PATH,
  ensureDataDirs,
} from "@/lib/paths";
import { parseSaveBytes } from "@/lib/parse-save";
import { readSettings, writeSettings } from "@/lib/settings";
import { buildRevealedNotebook } from "@/lib/spoiler-gate";
import { buildStarterSave, starterExportJson } from "@/lib/starter-fixture";
import type { NotebookPayload, ParsedSave, Settings, SnapshotId } from "@/lib/types";

type Listener = () => void;

let watcher: ReturnType<typeof chokidar.watch> | null = null;
let watchedDir = "";
let cachedSave: ParsedSave | null = null;
let lastError: string | null = null;
let lastSync: string | null = null;
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener();
}

function writeBundledExports() {
  ensureDataDirs();
  if (!fs.existsSync(DEMO_EXPORT_PATH)) {
    fs.writeFileSync(DEMO_EXPORT_PATH, JSON.stringify(demoExportJson(), null, 2));
  }
  if (!fs.existsSync(STARTER_EXPORT_PATH)) {
    fs.writeFileSync(STARTER_EXPORT_PATH, JSON.stringify(starterExportJson(), null, 2));
  }
}

function snapshotDir(snapshot: SnapshotId): string {
  if (snapshot === "day59") return DEMO_DIR;
  if (snapshot === "starter") return STARTER_DIR;
  return "";
}

function statMtime(filePath: string): string | null {
  try {
    return fs.statSync(filePath).mtime.toISOString();
  } catch {
    return null;
  }
}

function candidateFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const names = fs.readdirSync(dir);
  const preferred = ["MtHollyBlueprint.es3", "blueprint-export.json"];
  const ordered = [
    ...preferred.filter((name) => names.includes(name)),
    ...names.filter(
      (name) =>
        !preferred.includes(name) &&
        (name.endsWith(".es3") || name.endsWith(".json")) &&
        name !== "Settings.dat",
    ),
  ];
  return ordered.map((name) => path.join(dir, name));
}

function loadFromDir(dir: string, sourceHint?: ParsedSave["source"]): ParsedSave | null {
  const files = candidateFiles(dir);
  if (!files.length) return null;
  let lastFailure = "";
  for (const filePath of files) {
    try {
      const bytes = fs.readFileSync(filePath);
      return parseSaveBytes(bytes, {
        path: filePath,
        fileName: path.basename(filePath),
        mtime: statMtime(filePath),
        source: sourceHint,
      });
    } catch (error) {
      lastFailure = error instanceof Error ? error.message : String(error);
    }
  }
  throw new Error(lastFailure || "No readable save in folder");
}

function fallbackBundled(snapshot: SnapshotId): ParsedSave {
  if (snapshot === "day59") return buildDemoSave(DEMO_EXPORT_PATH);
  return buildStarterSave(STARTER_EXPORT_PATH);
}

function reload() {
  const settings = readSettings();
  try {
    if (settings.snapshot !== "live") {
      writeBundledExports();
      const dir = snapshotDir(settings.snapshot);
      try {
        const fromDisk = loadFromDir(dir, "demo");
        cachedSave = fromDisk ?? fallbackBundled(settings.snapshot);
      } catch {
        cachedSave = fallbackBundled(settings.snapshot);
      }
      lastError = null;
    } else {
      const dir = settings.watchPath.trim();
      if (!dir) {
        cachedSave = null;
        lastError = "Set a save folder, or keep a bundled morning open.";
      } else if (!fs.existsSync(dir)) {
        cachedSave = null;
        lastError = `Nothing at ${dir}. The game writes to AppData\\LocalLow\\Dogubomb\\BLUE PRINCE\\storage.`;
      } else {
        cachedSave = loadFromDir(dir);
        lastError = cachedSave ? null : "The folder is empty of .es3 or JSON exports.";
      }
    }
    lastSync = new Date().toISOString();
  } catch (error) {
    cachedSave = null;
    lastError = error instanceof Error ? error.message : String(error);
    lastSync = new Date().toISOString();
  }
  emit();
}

function syncWatcher() {
  const settings = readSettings();
  const dir = settings.snapshot === "live" ? settings.watchPath.trim() : snapshotDir(settings.snapshot);
  if (dir === watchedDir && watcher) return;
  if (watcher) {
    void watcher.close();
    watcher = null;
    watchedDir = "";
  }
  if (!dir) return;
  writeBundledExports();
  watcher = chokidar.watch(dir, {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 400, pollInterval: 100 },
  });
  watchedDir = dir;
  const bump = () => reload();
  watcher.on("add", bump).on("change", bump).on("unlink", bump);
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function applySettings(next: Settings | Partial<Settings>): Settings {
  const saved = writeSettings(next);
  syncWatcher();
  reload();
  return saved;
}

export function getNotebook(): NotebookPayload {
  if (!watchedDir && !cachedSave && !lastSync) {
    syncWatcher();
    reload();
  }
  const settings = readSettings();
  const resolvedPath =
    settings.snapshot === "live" ? settings.watchPath : snapshotDir(settings.snapshot);
  const notes = cachedSave ? readNotes(cachedSave.fingerprint) : [];
  return buildRevealedNotebook(cachedSave, {
    notes,
    status: {
      watching: Boolean(watcher && watchedDir),
      useDemo: settings.useDemo,
      snapshot: settings.snapshot,
      watchPath: settings.watchPath,
      resolvedPath,
      lastSync,
      source: cachedSave?.source ?? null,
      fileName: cachedSave?.fileName ?? null,
      day: cachedSave?.day ?? null,
      allowance: cachedSave?.allowance ?? null,
      fingerprint: cachedSave?.fingerprint ?? null,
      error: lastError,
      live: Boolean(watcher),
    },
  });
}

export function currentFingerprint(): string | null {
  return cachedSave?.fingerprint ?? null;
}

export function refreshNotebook() {
  reload();
  return getNotebook();
}

export function notifyNotebook() {
  emit();
}

ensureDataDirs();
writeBundledExports();
