"use client";

import { useMemo, useState } from "react";
import {
  Bookmark,
  LoaderCircle,
  Pin,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { SpiralBinding } from "@/components/notebook/SpiralBinding";
import { useNotebook } from "@/components/notebook/use-notebook";
import type { CustomNote, NotebookPayload, RevealedEntry, TabId } from "@/lib/types";

const TABS: { id: TabId; label: string; tint: string }[] = [
  { id: "index", label: "Index", tint: "#a7c6ed" },
  { id: "objectives", label: "Objectives", tint: "#6a9bd1" },
  { id: "documents", label: "Documents", tint: "#d7c39a" },
  { id: "secrets", label: "Secrets", tint: "#c5a3c7" },
  { id: "rooms", label: "Rooms", tint: "#9cbc9a" },
  { id: "notes", label: "Notes", tint: "#e2c07a" },
  { id: "settings", label: "Settings", tint: "#b8c4c8" },
];

const EMPTY: Record<TabId, string> = {
  index: "The notebook is bound. Point it at a save, or leave the demo estate open.",
  objectives: "No opened threads are filed from this save yet.",
  documents: "Nothing has been read into this save. Letters will appear here after you open them in the house.",
  secrets: "This save has not marked any discoveries yet.",
  rooms: "No rooms have been drafted into this save.",
  notes: "The facing page is blank. Write what you do not want the manor to forget.",
  settings: "Choose the demo snapshot or a live storage folder.",
};

function matchesQuery(query: string, ...parts: Array<string | string[] | undefined>) {
  if (!query.trim()) return true;
  const hay = parts
    .flat()
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(query.trim().toLowerCase());
}

function formatSync(value: string | null) {
  if (!value) return "never";
  const date = new Date(value);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function categoryTint(category: string) {
  if (category === "bedroom") return "bg-[#c98990]/80";
  if (category === "green") return "bg-[#3d7a4a]";
  if (category === "red") return "bg-[#a33c3c]";
  if (category === "hall") return "bg-[#1f4f6b]";
  if (category === "shop") return "bg-[#b08d57]";
  return "bg-[#176a8a]";
}

export function NotebookApp() {
  const { data, setData, loading, streamLive } = useNotebook();
  const [tab, setTab] = useState<TabId>("index");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [draft, setDraft] = useState({
    id: "",
    title: "",
    body: "",
    tags: "",
    pinned: false,
  });
  const [watchPath, setWatchPath] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const notebook = data;
  const settingsPath = notebook?.status.watchPath ?? "";
  const pathValue = watchPath ?? settingsPath;

  const filtered = useMemo(() => {
    if (!notebook) {
      return { entries: [] as RevealedEntry[], notes: [] as CustomNote[] };
    }
    if (tab === "objectives") {
      return {
        entries: notebook.objectives.filter((entry) =>
          matchesQuery(query, entry.title, entry.summary, entry.detail, entry.tags),
        ),
        notes: [],
      };
    }
    if (tab === "documents") {
      return {
        entries: notebook.documents.filter((entry) =>
          matchesQuery(query, entry.title, entry.summary, entry.detail, entry.tags),
        ),
        notes: [],
      };
    }
    if (tab === "secrets") {
      return {
        entries: notebook.secrets.filter((entry) =>
          matchesQuery(query, entry.title, entry.summary, entry.detail, entry.tags),
        ),
        notes: [],
      };
    }
    if (tab === "notes") {
      return {
        entries: [],
        notes: notebook.notes.filter((note) => matchesQuery(query, note.title, note.body, note.tags)),
      };
    }
    if (tab === "index") {
      const pool = [...notebook.objectives, ...notebook.facts, ...notebook.documents, ...notebook.secrets];
      return {
        entries: pool.filter((entry) => matchesQuery(query, entry.title, entry.summary, entry.detail, entry.tags)),
        notes: notebook.notes.filter((note) => matchesQuery(query, note.title, note.body, note.tags)),
      };
    }
    return { entries: [], notes: [] };
  }, [notebook, query, tab]);

  const rooms = useMemo(() => {
    if (!notebook || tab !== "rooms") return [];
    return notebook.rooms.filter((room) => matchesQuery(query, room.name, room.category));
  }, [notebook, query, tab]);

  const selectedEntry =
    filtered.entries.find((entry) => entry.id === selectedId) ??
    (tab === "index" || tab === "objectives" || tab === "documents" || tab === "secrets"
      ? filtered.entries[0]
      : undefined);
  const selectedNote =
    filtered.notes.find((note) => note.id === selectedId) ?? (tab === "notes" ? filtered.notes[0] : undefined);

  async function reload() {
    const response = await fetch("/api/notebook", { method: "POST" });
    setData((await response.json()) as NotebookPayload);
  }

  async function saveSettings(useDemo: boolean) {
    setSaving(true);
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useDemo, watchPath: pathValue }),
      });
      const json = (await response.json()) as { notebook: NotebookPayload };
      setData(json.notebook);
    } finally {
      setSaving(false);
    }
  }

  function openNote(note?: CustomNote) {
    setDraft({
      id: note?.id ?? "",
      title: note?.title ?? "",
      body: note?.body ?? "",
      tags: note?.tags.join(", ") ?? "",
      pinned: note?.pinned ?? false,
    });
    setNoteOpen(true);
  }

  async function submitNote() {
    setSaving(true);
    try {
      const payload = {
        title: draft.title,
        body: draft.body,
        tags: draft.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        pinned: draft.pinned,
      };
      const response = draft.id
        ? await fetch(`/api/notes/${draft.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/notes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const json = (await response.json()) as { notes: CustomNote[] };
      setData((current) => (current ? { ...current, notes: json.notes } : current));
      setNoteOpen(false);
      setTab("notes");
    } finally {
      setSaving(false);
    }
  }

  async function removeNote(id: string) {
    const response = await fetch(`/api/notes/${id}`, { method: "DELETE" });
    const json = (await response.json()) as { notes: CustomNote[] };
    setData((current) => (current ? { ...current, notes: json.notes } : current));
    setNoteOpen(false);
  }

  if (loading || !notebook) {
    return (
      <div className="desk-vignette flex min-h-screen items-center justify-center p-6">
        <div className="paper relative w-full max-w-md rounded-sm px-12 py-16 text-center shadow-2xl">
          <LoaderCircle className="mx-auto mb-4 size-6 animate-spin text-[#176a8a]" />
          <p className="font-hand text-2xl">Binding the pages…</p>
        </div>
      </div>
    );
  }

  const day = notebook.status.day;
  const live = streamLive || notebook.status.live;

  return (
    <div className="desk-vignette min-h-screen px-3 py-4 sm:px-6 sm:py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-3">
        <header className="flex flex-wrap items-end justify-between gap-3 px-2 text-[#a7c6ed]">
          <div>
            <p className="font-stamp text-xs tracking-[0.28em] uppercase">Mount Holly · Estate notebook</p>
            <h1 className="font-hand text-3xl text-[#f3e6c8] sm:text-4xl">Blue Prince Notes</h1>
          </div>
          <div className="flex items-center gap-3 font-stamp text-[11px] tracking-wide">
            <span className="inline-flex items-center gap-2">
              <span className={`size-2 rounded-full ${live ? "bg-[#9cbc9a]" : "bg-[#b08d57]"}`} />
              {live ? "LIVE" : "POLLING"}
            </span>
            <span>sync {formatSync(notebook.status.lastSync)}</span>
            <Button size="xs" variant="outline" className="border-[#4d7c99] bg-[#1a3e4f] text-[#a7c6ed]" onClick={() => void reload()}>
              <RefreshCw className="size-3" />
              Reload
            </Button>
          </div>
        </header>

        <div className="relative">
          <div className="absolute top-10 right-0 hidden flex-col gap-1 md:flex">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setTab(item.id);
                  setSelectedId(null);
                }}
                className={`tab-cut w-24 py-2 pr-2 pl-3 text-left font-stamp text-[10px] tracking-wider uppercase shadow-md transition ${
                  tab === item.id ? "translate-x-1 brightness-110" : "opacity-85 hover:translate-x-0.5"
                }`}
                style={{ background: item.tint, color: "#0d2b36" }}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="relative mr-0 md:mr-16">
            <div
              className="relative overflow-hidden rounded-sm shadow-[12px_18px_40px_rgb(6_18_24_/_0.55)]"
              style={{ transform: "rotate(-0.35deg)" }}
            >
              <SpiralBinding />
              <div className="grid min-h-[70vh] grid-cols-1 md:grid-cols-2">
                <section className="paper relative border-b border-[#c4b48a] md:border-r md:border-b-0">
                  <div className="flex h-full flex-col pl-12 sm:pl-16">
                    <div className="flex items-start justify-between gap-3 px-4 pt-5 pr-5">
                      <div>
                        <p className="font-stamp text-[10px] tracking-[0.25em] text-[#176a8a] uppercase">
                          {notebook.status.useDemo ? "Demo estate" : "Live save"}
                        </p>
                        <h2 className="font-hand text-2xl leading-tight">{TABS.find((item) => item.id === tab)?.label}</h2>
                      </div>
                      {typeof day === "number" && day > 0 ? (
                        <div className="day-stamp font-stamp px-3 py-2 text-center">
                          <div className="text-[10px] tracking-[0.3em]">DAY</div>
                          <div className="text-2xl leading-none">{day}</div>
                        </div>
                      ) : null}
                    </div>

                    <div className="px-4 pt-3 pr-5">
                      <div className="relative">
                        <Search className="absolute top-2.5 left-2.5 size-4 text-[#1f4f6b]" />
                        <Input
                          value={query}
                          onChange={(event) => setQuery(event.target.value)}
                          placeholder="Search what this save has already filed"
                          className="border-[#c4b48a] bg-[#f6ead0]/70 pl-8 font-print"
                        />
                      </div>
                      <div className="mt-3 flex gap-1 overflow-x-auto pb-1 md:hidden">
                        {TABS.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setTab(item.id);
                              setSelectedId(null);
                            }}
                            className={`shrink-0 rounded-sm px-2 py-1 font-stamp text-[10px] tracking-wider uppercase ${
                              tab === item.id ? "ring-2 ring-[#176a8a]" : ""
                            }`}
                            style={{ background: item.tint }}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <ScrollArea className="min-h-0 flex-1 px-2 py-3 pr-3">
                      {notebook.status.error ? (
                        <p className="mx-2 mb-3 border border-[#a33c3c]/40 bg-[#f3d4c8] px-3 py-2 font-print text-sm">
                          {notebook.status.error}
                        </p>
                      ) : null}

                      {tab === "index" ? (
                        <IndexList notebook={notebook} query={query} onOpenTab={setTab} />
                      ) : null}

                      {tab === "rooms" ? (
                        rooms.length ? (
                          <ul className="space-y-1 px-2">
                            {rooms.map((room) => (
                              <li
                                key={room.name}
                                className="flex items-baseline justify-between gap-3 border-b border-dashed border-[#c4b48a]/80 py-1.5"
                              >
                                <span className="flex items-center gap-2 font-hand text-lg">
                                  <span className={`size-2.5 rounded-full ${categoryTint(room.category)}`} />
                                  {room.name}
                                </span>
                                <span className="font-stamp text-xs text-[#176a8a]">
                                  {room.count}
                                  {room.rarity ? ` · rarity ${room.rarity > 0 ? "+" : ""}${room.rarity}` : ""}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <EmptyLine text={EMPTY.rooms} />
                        )
                      ) : null}

                      {tab === "notes" ? (
                        <div className="px-2">
                          <Button
                            size="sm"
                            className="mb-3 bg-[#176a8a] text-[#f3e6c8]"
                            onClick={() => openNote()}
                          >
                            <Plus className="size-4" />
                            New note
                          </Button>
                          {filtered.notes.length ? (
                            <ul className="space-y-2">
                              {filtered.notes
                                .slice()
                                .sort((a, b) => Number(b.pinned) - Number(a.pinned))
                                .map((note) => (
                                  <li key={note.id}>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedId(note.id)}
                                      className={`w-full rounded-sm border px-3 py-2 text-left ${
                                        selectedNote?.id === note.id
                                          ? "border-[#176a8a] bg-[#d7e6f5]/50"
                                          : "border-transparent hover:bg-[#efe4c8]"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        {note.pinned ? <Pin className="size-3 text-[#176a8a]" /> : null}
                                        <span className="font-hand text-lg">{note.title}</span>
                                      </div>
                                      <p className="line-clamp-2 font-script text-lg text-[#1a3e4f]">
                                        {note.body || "Blank page"}
                                      </p>
                                    </button>
                                  </li>
                                ))}
                            </ul>
                          ) : (
                            <EmptyLine text={EMPTY.notes} />
                          )}
                        </div>
                      ) : null}

                      {tab === "settings" ? (
                        <SettingsCopy />
                      ) : null}

                      {["objectives", "documents", "secrets"].includes(tab) ? (
                        filtered.entries.length ? (
                          <ul className="space-y-1 px-2">
                            {filtered.entries.map((entry) => (
                              <li key={entry.id}>
                                <button
                                  type="button"
                                  onClick={() => setSelectedId(entry.id)}
                                  className={`w-full rounded-sm px-3 py-2 text-left ${
                                    selectedEntry?.id === entry.id
                                      ? "bg-[#d7e6f5]/60"
                                      : "hover:bg-[#efe4c8]"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-hand text-lg">{entry.title}</span>
                                    {entry.complete ? (
                                      <Badge className="bg-[#3d7a4a] text-[#f3e6c8]">Filed</Badge>
                                    ) : null}
                                  </div>
                                  <p className="font-print text-sm text-[#1a3e4f]">{entry.summary}</p>
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <EmptyLine text={EMPTY[tab]} />
                        )
                      ) : null}
                    </ScrollArea>
                  </div>
                </section>

                <section className="paper relative min-h-[42vh]">
                  <div className="flex h-full flex-col px-5 py-5 pl-6 sm:pl-8">
                    {tab === "index" ? (
                      <IndexDetail notebook={notebook} />
                    ) : tab === "settings" ? (
                      <SettingsForm
                        useDemo={notebook.status.useDemo}
                        watchPath={pathValue}
                        setWatchPath={setWatchPath}
                        saving={saving}
                        onSave={saveSettings}
                        statusPath={notebook.status.resolvedPath}
                        fileName={notebook.status.fileName}
                      />
                    ) : tab === "notes" && selectedNote ? (
                      <article className="space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-stamp text-[10px] tracking-[0.25em] text-[#176a8a] uppercase">
                              Custom note
                            </p>
                            <h3 className="font-hand text-3xl">{selectedNote.title}</h3>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => openNote(selectedNote)}>
                            Edit
                          </Button>
                        </div>
                        <pre className="font-script text-2xl leading-snug whitespace-pre-wrap text-[#0d2b36]">
                          {selectedNote.body}
                        </pre>
                        <div className="flex flex-wrap gap-1">
                          {selectedNote.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="font-stamp text-[10px] tracking-wider uppercase">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </article>
                    ) : selectedEntry ? (
                      <article className="space-y-4">
                        <p className="font-stamp text-[10px] tracking-[0.25em] text-[#176a8a] uppercase">
                          {selectedEntry.kind}
                        </p>
                        <h3 className="font-hand text-3xl leading-tight">{selectedEntry.title}</h3>
                        <p className="font-print text-base leading-relaxed">{selectedEntry.detail}</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedEntry.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="font-stamp text-[10px] tracking-wider uppercase">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <p className="font-script text-xl text-[#1f4f6b]">
                          Only this save&apos;s findings are on the page. Unfound names stay off it.
                        </p>
                      </article>
                    ) : tab === "rooms" ? (
                      <div className="space-y-3">
                        <h3 className="font-hand text-3xl">Room register</h3>
                        <p className="font-print leading-relaxed">
                          Draft counts from this save only. Rooms that have never entered the house are not listed.
                          Dots mark bedroom, hall, green, red, shop, or other — for rooms you have already walked.
                        </p>
                        <p className="font-stamp text-sm text-[#176a8a]">
                          {notebook.rooms.length} rooms filed · {notebook.rooms.reduce((sum, room) => sum + room.count, 0)} drafts
                        </p>
                      </div>
                    ) : (
                      <EmptyLine text={EMPTY[tab]} />
                    )}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent className="paper max-w-lg border-[#c4b48a] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-hand text-2xl">
              {draft.id ? "Revise a page" : "A new page"}
            </DialogTitle>
            <DialogDescription className="font-print">
              Custom notes belong to this save. They never pull names from unfound catalog entries.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="note-title" className="font-stamp text-[10px] tracking-widest uppercase">
                Title
              </Label>
              <Input
                id="note-title"
                value={draft.title}
                onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="note-body" className="font-stamp text-[10px] tracking-widest uppercase">
                Body
              </Label>
              <Textarea
                id="note-body"
                rows={8}
                className="font-script min-h-40 text-xl"
                value={draft.body}
                onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="note-tags" className="font-stamp text-[10px] tracking-widest uppercase">
                Tags
              </Label>
              <Input
                id="note-tags"
                placeholder="chess, precipice"
                value={draft.tags}
                onChange={(event) => setDraft((current) => ({ ...current, tags: event.target.value }))}
              />
            </div>
            <label className="flex items-center gap-2 font-print text-sm">
              <input
                type="checkbox"
                checked={draft.pinned}
                onChange={(event) => setDraft((current) => ({ ...current, pinned: event.target.checked }))}
              />
              Pin to the front
            </label>
          </div>
          <DialogFooter className="border-[#c4b48a] bg-transparent">
            {draft.id ? (
              <Button variant="destructive" onClick={() => void removeNote(draft.id)}>
                <Trash2 className="size-4" />
                Discard
              </Button>
            ) : null}
            <Button className="bg-[#176a8a] text-[#f3e6c8]" disabled={saving} onClick={() => void submitNote()}>
              <Bookmark className="size-4" />
              File note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <p className="px-3 py-6 font-script text-2xl leading-snug text-[#1f4f6b]">{text}</p>;
}

function IndexList({
  notebook,
  query,
  onOpenTab,
}: {
  notebook: NotebookPayload;
  query: string;
  onOpenTab: (tab: TabId) => void;
}) {
  const open = notebook.objectives.filter((entry) => !entry.complete);
  const visible = open.filter((entry) => matchesQuery(query, entry.title, entry.summary));
  return (
    <div className="space-y-4 px-3">
      <p className="font-print text-sm leading-relaxed text-[#1a3e4f]">
        Allowance {notebook.status.allowance ?? "—"} · {notebook.documents.length} documents ·{" "}
        {notebook.secrets.length} secrets · {notebook.rooms.length} rooms · {notebook.notes.length} notes
      </p>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["objectives", notebook.objectives.length],
            ["documents", notebook.documents.length],
            ["secrets", notebook.secrets.length],
            ["rooms", notebook.rooms.length],
            ["notes", notebook.notes.length],
          ] as const
        ).map(([id, count]) => (
          <button
            key={id}
            type="button"
            onClick={() => onOpenTab(id)}
            className="rounded-sm border border-[#c4b48a] bg-[#f6ead0] px-2 py-1 font-stamp text-[10px] tracking-wider uppercase"
          >
            {id} {count}
          </button>
        ))}
      </div>
      <div>
        <h3 className="font-hand text-xl">Open threads</h3>
        {visible.length ? (
          <ul className="mt-1 space-y-2">
            {visible.map((entry) => (
              <li key={entry.id} className="border-b border-dashed border-[#c4b48a] pb-2">
                <p className="font-hand text-lg">{entry.title}</p>
                <p className="font-print text-sm">{entry.summary}</p>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyLine text={EMPTY.objectives} />
        )}
      </div>
    </div>
  );
}

function IndexDetail({ notebook }: { notebook: NotebookPayload }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="font-stamp text-[10px] tracking-[0.25em] text-[#176a8a] uppercase">Facing page</p>
        <h3 className="font-hand text-3xl">What this save already holds</h3>
      </div>
      <p className="font-print leading-relaxed">
        This notebook lives beside the game. It rereads{" "}
        <span className="font-stamp text-sm">MtHollyBlueprint.es3</span> (or a JSON export) and files only
        discoveries already true for this estate. Blank paper is not a checklist of secrets.
      </p>
      <ul className="space-y-3">
        {notebook.facts.map((fact) => (
          <li key={fact.id} className="border-l-2 border-[#176a8a] pl-3">
            <p className="font-hand text-lg">{fact.title}</p>
            <p className="font-print text-sm">{fact.summary}</p>
          </li>
        ))}
      </ul>
      {notebook.notes[0] ? (
        <div className="rounded-sm border border-[#c4b48a] bg-[#f6ead0] p-3">
          <p className="font-stamp text-[10px] tracking-[0.2em] text-[#176a8a] uppercase">Pinned note</p>
          <p className="font-hand text-xl">{notebook.notes.find((note) => note.pinned)?.title ?? notebook.notes[0].title}</p>
          <p className="font-script line-clamp-5 text-xl">
            {(notebook.notes.find((note) => note.pinned) ?? notebook.notes[0]).body}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function SettingsCopy() {
  return (
    <div className="space-y-3 px-3 font-print text-sm leading-relaxed">
      <p>
        Default folder on Windows:{" "}
        <span className="font-stamp text-xs break-all">
          %USERPROFILE%\AppData\LocalLow\Dogubomb\BLUE PRINCE\storage
        </span>
      </p>
      <p>
        Drop a decrypted JSON export in the same folder if you would rather not decrypt the Easy Save 3 file
        here. The notebook never writes back to the game.
      </p>
      <p>Unfound rooms, unread mail, and unopened doors are omitted — not greyed out.</p>
    </div>
  );
}

function SettingsForm({
  useDemo,
  watchPath,
  setWatchPath,
  saving,
  onSave,
  statusPath,
  fileName,
}: {
  useDemo: boolean;
  watchPath: string;
  setWatchPath: (value: string) => void;
  saving: boolean;
  onSave: (useDemo: boolean) => Promise<void>;
  statusPath: string;
  fileName: string | null;
}) {
  return (
    <div className="space-y-4">
      <h3 className="font-hand text-3xl">Bind to a save</h3>
      <p className="font-print text-sm leading-relaxed">
        Watching {statusPath || "—"}. Current file: {fileName ?? "none"}.
      </p>
      <label className="flex items-center gap-2 font-print">
        <input type="checkbox" checked={useDemo} onChange={(event) => void onSave(event.target.checked)} />
        Use the bundled Day 59 demo snapshot
      </label>
      <div className="space-y-1">
        <Label htmlFor="watch-path" className="font-stamp text-[10px] tracking-widest uppercase">
          Save folder
        </Label>
        <Input
          id="watch-path"
          value={watchPath}
          onChange={(event) => setWatchPath(event.target.value)}
          placeholder="C:\Users\...\BLUE PRINCE\storage"
          disabled={useDemo}
        />
      </div>
      <Button
        className="bg-[#176a8a] text-[#f3e6c8]"
        disabled={saving || useDemo}
        onClick={() => void onSave(false)}
      >
        Watch this folder
      </Button>
    </div>
  );
}
