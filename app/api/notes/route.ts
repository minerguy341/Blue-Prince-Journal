import { currentFingerprint, getNotebook, notifyNotebook } from "@/lib/save-store";
import { readNotes, upsertNote } from "@/lib/notes-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const fingerprint = currentFingerprint() ?? getNotebook().status.fingerprint;
  if (!fingerprint) return Response.json({ notes: [] });
  return Response.json({ notes: readNotes(fingerprint) });
}

export async function POST(request: Request) {
  const fingerprint = currentFingerprint() ?? getNotebook().status.fingerprint;
  if (!fingerprint) {
    return Response.json({ error: "No save is loaded." }, { status: 400 });
  }
  const body = (await request.json()) as {
    title?: string;
    body?: string;
    tags?: string[];
    pinned?: boolean;
    linkedEntryId?: string | null;
  };
  const note = upsertNote(fingerprint, {
    title: body.title,
    body: body.body,
    tags: body.tags,
    pinned: body.pinned,
    linkedEntryId: body.linkedEntryId ?? null,
  });
  notifyNotebook();
  return Response.json({ note, notes: readNotes(fingerprint) });
}
