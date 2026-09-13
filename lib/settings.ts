import fs from "node:fs";

import { defaultWatchPath, ensureDataDirs, SETTINGS_PATH } from "@/lib/paths";
import type { Settings } from "@/lib/types";

const FALLBACK: Settings = {
  useDemo: true,
  watchPath: defaultWatchPath(),
};

export function readSettings(): Settings {
  ensureDataDirs();
  try {
    const raw = fs.readFileSync(SETTINGS_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      useDemo: parsed.useDemo ?? true,
      watchPath: typeof parsed.watchPath === "string" ? parsed.watchPath : FALLBACK.watchPath,
    };
  } catch {
    writeSettings(FALLBACK);
    return { ...FALLBACK };
  }
}

export function writeSettings(next: Settings): Settings {
  ensureDataDirs();
  const settings: Settings = {
    useDemo: Boolean(next.useDemo),
    watchPath: next.watchPath?.trim() ?? "",
  };
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
  return settings;
}
