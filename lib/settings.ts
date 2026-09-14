import fs from "node:fs";

import { defaultWatchPath, ensureDataDirs, SETTINGS_PATH } from "@/lib/paths";
import type { Settings, SnapshotId } from "@/lib/types";

function normalize(partial: Partial<Settings>): Settings {
  const watchPath = typeof partial.watchPath === "string" ? partial.watchPath : defaultWatchPath();
  let snapshot: SnapshotId = "starter";
  if (partial.snapshot === "starter" || partial.snapshot === "day59" || partial.snapshot === "live") {
    snapshot = partial.snapshot;
  } else if (partial.useDemo === false) {
    snapshot = "live";
  }
  return {
    snapshot,
    useDemo: snapshot !== "live",
    watchPath,
  };
}

export function readSettings(): Settings {
  ensureDataDirs();
  try {
    const raw = fs.readFileSync(SETTINGS_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<Settings>;
    const settings = normalize(parsed);
    if (parsed.snapshot !== settings.snapshot || parsed.useDemo !== settings.useDemo) {
      writeSettings(settings);
    }
    return settings;
  } catch {
    const fallback = normalize({ snapshot: "starter", useDemo: true, watchPath: defaultWatchPath() });
    writeSettings(fallback);
    return fallback;
  }
}

export function writeSettings(next: Settings | Partial<Settings>): Settings {
  ensureDataDirs();
  const settings = normalize(next);
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
  return settings;
}
