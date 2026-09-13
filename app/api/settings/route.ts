import { applySettings, getNotebook } from "@/lib/save-store";
import { readSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return Response.json({ settings: readSettings(), notebook: getNotebook() });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { useDemo?: boolean; watchPath?: string };
  const current = readSettings();
  const settings = applySettings({
    useDemo: body.useDemo ?? current.useDemo,
    watchPath: body.watchPath ?? current.watchPath,
  });
  return Response.json({ settings, notebook: getNotebook() });
}
