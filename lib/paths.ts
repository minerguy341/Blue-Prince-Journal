import fs from "node:fs";
import path from "node:path";

export const ROOT = process.cwd();
export const DATA_DIR = path.join(ROOT, ".data");
export const NOTES_DIR = path.join(DATA_DIR, "notes");
export const SETTINGS_PATH = path.join(DATA_DIR, "settings.json");
export const DEMO_DIR = path.join(ROOT, "data", "demo-storage");
export const DEMO_EXPORT_PATH = path.join(DEMO_DIR, "blueprint-export.json");
export const STARTER_DIR = path.join(ROOT, "data", "starter-storage");
export const STARTER_EXPORT_PATH = path.join(STARTER_DIR, "blueprint-export.json");

export function ensureDataDirs() {
  fs.mkdirSync(NOTES_DIR, { recursive: true });
  fs.mkdirSync(DEMO_DIR, { recursive: true });
  fs.mkdirSync(STARTER_DIR, { recursive: true });
}

export function defaultWatchPath(): string {
  const home = process.env.USERPROFILE || process.env.HOME || "";
  if (process.platform === "win32" && home) {
    return path.join(home, "AppData", "LocalLow", "Dogubomb", "BLUE PRINCE", "storage");
  }
  return "";
}
