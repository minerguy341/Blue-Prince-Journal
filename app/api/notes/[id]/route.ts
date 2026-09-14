import { currentFingerprint, getNotebook, notifyNotebook } from "@/lib/save-store";
import { deleteNote, readNotes, upsertNote } from "@/lib/notes-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const { id } = await context.params;
  const fingerprint = currentFingerprint() ?? getNotebook().status.fingerprint;
  if (!fingerprint) return Response.json({ error: "No save is loaded." }, { status: 400 });
  const body = (await request.json()) as {
    title?: string;
    body?: string;
    tags?: string[];
    pinned?: boolean;
    linkedEntryId?: string | null;
  };
  try {
    const note = upsertNote(fingerprint, { id, ...body });
    notifyNotebook();
    return Response.json({ note, notes: readNotes(fingerprint) });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not update note" },
      { status: 404 },
    );
  }
}

export async function DELETE(_request: Request, context: Context) {
  const { id } = await context.params;
  const fingerprint = currentFingerprint() ?? getNotebook().status.fingerprint;
  if (!fingerprint) return Response.json({ error: "No save is loaded." }, { status: 400 });
  const ok = deleteNote(fingerprint, id);
  if (!ok) return Response.json({ error: "Note not found" }, { status: 404 });
  notifyNotebook();
  return Response.json({ notes: readNotes(fingerprint) });
}
