import { applySettings, getNotebook } from "@/lib/save-store";
import { readSettings } from "@/lib/settings";
import type { SnapshotId } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return Response.json({ settings: readSettings(), notebook: getNotebook() });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    snapshot?: SnapshotId;
    useDemo?: boolean;
    watchPath?: string;
  };
  const current = readSettings();
  let snapshot = body.snapshot ?? current.snapshot;
  if (!body.snapshot && body.useDemo === true) snapshot = current.snapshot === "day59" ? "day59" : "starter";
  if (!body.snapshot && body.useDemo === false) snapshot = "live";
  const settings = applySettings({
    snapshot,
    watchPath: body.watchPath ?? current.watchPath,
  });
  return Response.json({ settings, notebook: getNotebook() });
}
