import fs from "node:fs";
import path from "node:path";

import chokidar from "chokidar";

import { buildDemoSave, demoExportJson } from "@/lib/demo-fixture";
import { readNotes } from "@/lib/notes-store";
import { DEMO_DIR, DEMO_EXPORT_PATH, ensureDataDirs } from "@/lib/paths";
import { parseSaveBytes } from "@/lib/parse-save";
import { readSettings, writeSettings } from "@/lib/settings";
import { buildRevealedNotebook } from "@/lib/spoiler-gate";
import type { NotebookPayload, ParsedSave, Settings } from "@/lib/types";

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

function writeDemoExportIfMissing() {
  ensureDataDirs();
  if (!fs.existsSync(DEMO_EXPORT_PATH)) {
    fs.writeFileSync(DEMO_EXPORT_PATH, JSON.stringify(demoExportJson(), null, 2));
  }
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

function reload() {
  const settings = readSettings();
  try {
    if (settings.useDemo) {
      writeDemoExportIfMissing();
      try {
        const fromDisk = loadFromDir(DEMO_DIR, "demo");
        cachedSave = fromDisk ?? buildDemoSave(DEMO_EXPORT_PATH);
      } catch {
        cachedSave = buildDemoSave(DEMO_EXPORT_PATH);
      }
      lastError = null;
    } else {
      const dir = settings.watchPath.trim();
      if (!dir) {
        cachedSave = null;
        lastError = "Set a save folder, or keep the demo estate open.";
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
  const dir = settings.useDemo ? DEMO_DIR : settings.watchPath.trim();
  if (dir === watchedDir && watcher) return;
  if (watcher) {
    void watcher.close();
    watcher = null;
    watchedDir = "";
  }
  if (!dir) return;
  writeDemoExportIfMissing();
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

export function applySettings(next: Settings): Settings {
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
  const resolvedPath = settings.useDemo ? DEMO_DIR : settings.watchPath;
  const notes = cachedSave ? readNotes(cachedSave.fingerprint) : [];
  return buildRevealedNotebook(cachedSave, {
    notes,
    status: {
      watching: Boolean(watcher && watchedDir),
      useDemo: settings.useDemo,
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
writeDemoExportIfMissing();
