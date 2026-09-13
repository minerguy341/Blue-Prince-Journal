import assert from "node:assert/strict";
import test from "node:test";

import { emptyParsedSave, revealEntries, revealRooms } from "@/lib/catalog";
import { buildDemoSave } from "@/lib/demo-fixture";
import { parseSaveDocument } from "@/lib/parse-save";
import { catalogTextBlob } from "@/lib/spoiler-gate";

test("day 59 demo files opened threads and hides the rest", () => {
  const save = buildDemoSave();
  const entries = revealEntries(save);
  const rooms = revealRooms(save);
  const blob = catalogTextBlob(entries);

  assert.equal(save.day, 59);
  assert.ok(entries.some((entry) => entry.id === "doc-network-password"));
  assert.ok(entries.some((entry) => entry.id === "obj-sanctum"));
  assert.match(blob, /keys in hand: 1 and 8/);
  assert.match(blob, /nuance/);
  assert.match(blob, /orinda aries/);
  assert.doesNotMatch(blob, /sanctum key 2/);
  assert.doesNotMatch(blob, /arch aries/);
  assert.doesNotMatch(blob, /red envelope — study/);
  assert.doesNotMatch(blob, /cloister letter/);
  assert.doesNotMatch(blob, /diary/);
  assert.doesNotMatch(blob, /memoblue/);
  assert.doesNotMatch(blob, /throne room/);
  assert.doesNotMatch(blob, /treasure trove/);
  assert.doesNotMatch(blob, /lost & found/);
  assert.ok(rooms.every((room) => room.count > 0));
  assert.ok(rooms.some((room) => room.name.toLowerCase().includes("bedroom")));
  assert.ok(!rooms.some((room) => /throne|treasure trove|lost/i.test(room.name)));
  assert.ok(entries.some((entry) => entry.id === "sec-draft-pool" && /solarium/i.test(entry.summary)));
});

test("empty save reveals nothing", () => {
  const entries = revealEntries(emptyParsedSave());
  const rooms = revealRooms(emptyParsedSave());
  assert.equal(entries.length, 0);
  assert.equal(rooms.length, 0);
});

test("parser flattens BluePrint.objs and skips false flags", () => {
  const parsed = parseSaveDocument(
    {
      source: "demo",
      save_created: "2025-10-01T23:11:00",
      BluePrint: {
        value: {
          objs: {
            DAY: { __type: "System.Int32", value: 12 },
            "?Sanctum": { __type: "System.Boolean", value: true },
            "sanctum key 2": { __type: "System.Boolean", value: false },
            "NETWORK PASSWORD": { __type: "System.String", value: "SWANSONG" },
          },
        },
      },
      RoomRecords: { PARLOR: 3, "THRONE ROOM": 0 },
    },
    { path: "test.json", fileName: "test.json", mtime: null, source: "json" },
  );
  assert.equal(parsed.day, 12);
  assert.equal(parsed.flags["?Sanctum"], true);
  assert.equal(parsed.flags["sanctum key 2"], undefined);
  assert.equal(parsed.strings["NETWORK PASSWORD"], "SWANSONG");
  const rooms = revealRooms(parsed);
  assert.deepEqual(rooms.map((room) => room.name), ["Parlor"]);
  const blob = catalogTextBlob(revealEntries(parsed));
  assert.doesNotMatch(blob, /sanctum key 2/);
  assert.match(blob, /the sanctum/);
});
