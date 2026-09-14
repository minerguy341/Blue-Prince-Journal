import type { ParsedSave, RevealedEntry, RoomEntry } from "@/lib/types";

type Ctx = {
  flag: (name: string) => boolean;
  num: (name: string) => number;
  str: (name: string) => string;
  room: (name: string) => number;
};

type CatalogDef = {
  id: string;
  kind: RevealedEntry["kind"];
  title: string;
  tags: string[];
  reveal: (ctx: Ctx) => boolean;
  summary: (ctx: Ctx) => string;
  detail?: (ctx: Ctx) => string;
  complete?: (ctx: Ctx) => boolean;
};

const SANCTUM_KEYS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
const SANCTUM_DOORS: [string, string][] = [
  ["sanctum door nuance", "Nuance"],
  ["sanctum door orinda aries", "Orinda Aries"],
  ["sanctum door arch aries", "Arch Aries"],
  ["sanctum door corarica", "Corarica"],
  ["sanctum door eraja", "Eraja"],
  ["sanctum door fenn aries", "Fenn Aries"],
  ["sanctum door mora jai", "Mora Jai"],
  ["sanctum door verra", "Verra"],
];

const TROPHIES: [string, string][] = [
  ["Trophy 8", "Trophy 8"],
  ["Trophy Inheritance", "Inheritance"],
  ["Trophy Bullseye", "Bullseye"],
  ["Trophy Cursed", "Cursed"],
  ["Trophy Darebird", "Darebird"],
  ["Trophy Derigi", "Dirigiblocks"],
  ["Trophy Diploma", "Diploma"],
  ["Trophy Explorers", "Explorers"],
  ["Trophy Fullhouse", "Full House"],
  ["Trophy Invention", "Invention"],
  ["Trophy Logical", "Logical"],
  ["Trophy Sigils", "Sigils"],
  ["Trophy Speed", "Speed"],
  ["Trophy Trophies", "Trophies"],
  ["Trophy Wealth", "Wealth"],
];

const UPGRADE_DISCS: [string, string][] = [
  ["Upgrade Disc - Commissary", "Commissary"],
  ["Upgrade Disc - Foundation", "Foundation"],
  ["Upgrade Disc - Garage", "Garage"],
  ["Upgrade Disc - Great Hall", "Great Hall"],
  ["Upgrade Disc - Master Bedroom", "Master Bedroom"],
  ["Upgrade Disc - Morning Room", "Morning Room"],
  ["Upgrade Disc - Office", "Office"],
  ["Upgrade Disc - Torch Room", "Torch Room"],
  ["Upgrade Disc - Archives", "Archives"],
  ["Upgrade Disc - Bootleg", "Bootleg"],
  ["Upgrade Disc - Cloister", "Cloister"],
  ["Upgrade Disc - Freezer", "Freezer"],
  ["Upgrade Disc - LostFound", "Lost & Found"],
  ["Upgrade Disc - Mechanarium", "Mechanarium"],
  ["Upgrade Disc - Shop", "Shop"],
  ["Upgrade Disc - Tomb", "Tomb"],
];

const ROOM_UPGRADES: [string, string][] = [
  ["Upgrade Boudoir", "Boudoir"],
  ["Upgrade Closet", "Closet"],
  ["Upgrade Courtyard", "Courtyard"],
  ["Upgrade Guest Bedroom", "Guest Bedroom"],
  ["Upgrade Nook", "Nook"],
  ["Upgrade Parlor", "Parlor"],
  ["Upgrade Spare Room", "Spare Room"],
  ["Upgrade Storeroom", "Storeroom"],
  ["Upgrade Aquarium", "Aquarium"],
  ["Upgrade Billiard", "Billiard Room"],
  ["Upgrade Bunk Room", "Bunk Room"],
  ["Upgrade Cloister", "Cloister"],
  ["Upgrade Hallway", "Hallway"],
  ["Upgrade Mail Room", "Mail Room"],
  ["Upgrade Nursery", "Nursery"],
];

const DRAFT_ADDITIONS: [string, string][] = [
  ["Casino Added", "Casino"],
  ["Classroom Added", "Classroom"],
  ["Clock Tower Added", "Clock Tower"],
  ["Conservatory Added", "Conservatory"],
  ["Dormitory Added", "Dormitory"],
  ["Dovecote Added", "Dovecote"],
  ["Mechanarium Added", "Mechanarium"],
  ["Planetarium Added", "Planetarium"],
  ["Solarium Added", "Solarium"],
  ["The Kennel Added", "The Kennel"],
  ["Vestibule Added", "Vestibule"],
  ["Throne Room Added", "Throne Room"],
  ["Treasure Trove Added", "Treasure Trove"],
  ["Lost&Found Added", "Lost & Found"],
  ["Closed Exhibit Added", "Closed Exhibit"],
  ["Tunnel Added", "Tunnel"],
];

const ROOM_CATEGORIES: Record<string, string> = {
  BEDROOM: "bedroom",
  "GUEST BEDROOM": "bedroom",
  NURSERY: "bedroom",
  "BUNK ROOM": "bedroom",
  "MASTER BEDROOM": "bedroom",
  DORMITORY: "bedroom",
  "SERVANT'S QUARTERS": "bedroom",
  "MAID'S CHAMBER": "bedroom",
  "HER LADYSHIP'S CHAMBER": "bedroom",
  BOUDOIR: "bedroom",
  HALLWAY: "hall",
  CORRIDOR: "hall",
  FOYER: "hall",
  PASSAGEWAY: "hall",
  "WEST WING HALL": "hall",
  "EAST WING HALL": "hall",
  "GREAT HALL": "hall",
  "ENTRANCE HALL": "hall",
  "SECRET PASSAGE": "hall",
  CHAPEL: "red",
  MAUSOLEUM: "red",
  "DARKROOM": "red",
  FURNACE: "red",
  "LAUNDRY ROOM": "red",
  GYMNASIUM: "red",
  "WEIGHT ROOM": "red",
  COURTYARD: "green",
  PATIO: "green",
  TERRACE: "green",
  VERANDA: "green",
  "SECRET GARDEN": "green",
  GREENHOUSE: "green",
  AQUARIUM: "green",
  CLOISTER: "green",
  "THE POOL": "green",
  COMMISSARY: "shop",
  SHOWROOM: "shop",
  "LOCKSMITH": "shop",
  "GIFT SHOP": "shop",
  BOOKSHOP: "shop",
  "TRADING POST": "shop",
  KITCHEN: "shop",
  PANTRY: "shop",
};

function titleCaseRoom(name: string): string {
  return name
    .toLowerCase()
    .split(/(\s+|')/)
    .map((part) => {
      if (part === " " || part === "'") return part;
      if (["the", "of", "and"].includes(part)) return part;
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join("")
    .replace(/\bRoom 46\b/i, "Room 46")
    .replace(/\bRoom 8\b/i, "Room 8");
}

function list(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function foundKeys(ctx: Ctx): number[] {
  return SANCTUM_KEYS.filter((n) => ctx.flag(`sanctum key ${n}`));
}

function foundDoors(ctx: Ctx): string[] {
  return SANCTUM_DOORS.filter(([flag]) => ctx.flag(flag)).map(([, name]) => name);
}

function foundTrophies(ctx: Ctx): string[] {
  return TROPHIES.filter(([flag]) => ctx.flag(flag)).map(([, name]) => name);
}

function foundDiscs(ctx: Ctx): string[] {
  return UPGRADE_DISCS.filter(([flag]) => ctx.flag(flag)).map(([, name]) => name);
}

function foundRoomUpgrades(ctx: Ctx): string[] {
  return ROOM_UPGRADES.filter(([key]) => ctx.num(key) > 0).map(
    ([key, name]) => `${name} (rank ${ctx.num(key)})`,
  );
}

function foundAdditions(ctx: Ctx): string[] {
  return DRAFT_ADDITIONS.filter(([flag]) => ctx.flag(flag)).map(([, name]) => name);
}

const CATALOG: CatalogDef[] = [
  {
    id: "obj-sanctum",
    kind: "objective",
    title: "The Sanctum",
    tags: ["sanctum"],
    reveal: (ctx) => ctx.flag("?Sanctum"),
    complete: (ctx) =>
      SANCTUM_KEYS.every((n) => ctx.flag(`sanctum key ${n}`)) &&
      SANCTUM_DOORS.every(([flag]) => ctx.flag(flag)),
    summary: () => "A sealed inner work you have already stepped into.",
    detail: (ctx) => {
      const keys = foundKeys(ctx).map(String);
      const doors = foundDoors(ctx);
      const lines = [];
      if (keys.length) lines.push(`Keys in hand: ${list(keys)}.`);
      if (doors.length) lines.push(`Doors that have answered: ${list(doors)}.`);
      if (!keys.length && !doors.length) {
        lines.push("The sanctum is known. Nothing further from this save is filed yet.");
      }
      return lines.join(" ");
    },
  },
  {
    id: "obj-trophies",
    kind: "objective",
    title: "Trophy cabinet",
    tags: ["trophies"],
    reveal: (ctx) => ctx.flag("?Trophy") || foundTrophies(ctx).length > 0,
    complete: () => false,
    summary: () => "Silver already earned stays in the cabinet. Nothing else is named.",
    detail: (ctx) => {
      const trophies = foundTrophies(ctx);
      return trophies.length
        ? `Filed: ${list(trophies)}.`
        : "The cabinet exists. No trophies are filed from this save yet.";
    },
  },
  {
    id: "obj-upgrades",
    kind: "objective",
    title: "Upgrade discs",
    tags: ["upgrades"],
    reveal: (ctx) => ctx.flag("?Upgrade") || foundDiscs(ctx).length > 0,
    complete: () => false,
    summary: () => "Discs already found, and rooms you have already rewritten.",
    detail: (ctx) => {
      const discs = foundDiscs(ctx);
      const ranks = foundRoomUpgrades(ctx);
      const lines = [];
      if (discs.length) lines.push(`Discs in hand: ${list(discs)}.`);
      if (ranks.length) lines.push(`Permanent ranks: ${list(ranks)}.`);
      if (ctx.num("Upgrade Tally") > 0) lines.push(`Upgrade tally: ${ctx.num("Upgrade Tally")}.`);
      return lines.join(" ") || "Upgrade work is underway; nothing further is filed.";
    },
  },
  {
    id: "obj-west-path",
    kind: "objective",
    title: "West path",
    tags: ["estate"],
    reveal: (ctx) => ctx.flag("?West Path"),
    complete: (ctx) =>
      ctx.flag("West Gate Open") && ctx.flag("Apple Orchard Open") && ctx.flag("Gemstone Cavern Open"),
    summary: () => "The western grounds you have already walked.",
    detail: (ctx) => {
      const found = [
        ctx.flag("West Gate Open") ? "West gate" : null,
        ctx.flag("Apple Orchard Open") ? "Apple orchard" : null,
        ctx.flag("Gemstone Cavern Open") ? "Gemstone cavern" : null,
        ctx.flag("Gas Flame - Orchard") ? "Orchard flame" : null,
        ctx.flag("Gas Flame - Gemstone") ? "Gemstone flame" : null,
      ].filter((item): item is string => Boolean(item));
      return found.length ? `Opened: ${list(found)}.` : "The west path is known.";
    },
  },
  {
    id: "obj-foundation",
    kind: "objective",
    title: "The Foundation",
    tags: ["estate"],
    reveal: (ctx) => ctx.flag("Foundation") || ctx.room("THE FOUNDATION") > 0,
    complete: () => false,
    summary: () => "A permanent room already placed.",
    detail: (ctx) => {
      const tiles = [
        ctx.str("Foundation Tile String E") ? `E ${ctx.str("Foundation Tile String E")}` : null,
        ctx.str("Foundation Tile String S") ? `S ${ctx.str("Foundation Tile String S")}` : null,
        ctx.str("Foundation Tile String W") ? `W ${ctx.str("Foundation Tile String W")}` : null,
      ].filter((item): item is string => Boolean(item));
      const extra = ctx.flag("Foundation Elevator Down") ? " The elevator has been sent down." : "";
      return tiles.length ? `Tiles: ${list(tiles)}.${extra}` : `The Foundation is placed.${extra}`;
    },
  },
  {
    id: "obj-power",
    kind: "objective",
    title: "Power and steam",
    tags: ["boiler", "underground"],
    reveal: (ctx) => ctx.flag("?Power Source") || ctx.flag("Boiler A On"),
    complete: (ctx) => ctx.flag("Boiler A On") && ctx.flag("Boiler B On") && ctx.flag("Boiler C On"),
    summary: () => "Boilers and pumps you have already handled.",
    detail: (ctx) => {
      const boilers = [
        ctx.flag("Boiler A On") ? "A" : null,
        ctx.flag("Boiler B On") ? "B" : null,
        ctx.flag("Boiler C On") ? "C" : null,
      ].filter((item): item is string => Boolean(item));
      const extra = [
        ctx.flag("Boiler Gate Up") ? "gate raised" : null,
        ctx.flag("Grotto Open") ? "grotto open" : null,
        ctx.num("Reservoir Level") > 0 ? `reservoir ${ctx.num("Reservoir Level")}` : null,
      ].filter((item): item is string => Boolean(item));
      return `Boilers lit: ${list(boilers) || "none filed"}. ${extra.length ? extra.join("; ") + "." : ""}`.trim();
    },
  },
  {
    id: "obj-room-46",
    kind: "objective",
    title: "Room 46",
    tags: ["estate"],
    reveal: (ctx) => ctx.flag("Room 46 Reached") || ctx.room("ROOM 46") > 0,
    complete: () => true,
    summary: () => "Reached. The notebook files the arrival and nothing beyond it.",
    detail: () => "You have stood in Room 46. Later doors stay blank until this save opens them.",
  },
  {
    id: "doc-invitation",
    kind: "document",
    title: "Letter of arrival",
    tags: ["estate"],
    reveal: (ctx) => ctx.flag("PickedupBluePrint") && ctx.num("DAY") >= 1,
    summary: () => "The letter that brought you to the door sits in the front of this notebook.",
    detail: () =>
      "Filed on the first morning. Copy any wording you need into your own notes. This page does not name later rooms.",
  },
  {
    id: "doc-office-mail",
    kind: "document",
    title: "Office mail",
    tags: ["mail", "office"],
    reveal: (ctx) => ctx.flag("OFFICE MAIL"),
    summary: () => "A letter already opened in the Office.",
    detail: () => "Filed from this save. Copy the wording into your own notes if you need it beside you.",
  },
  {
    id: "doc-red-boudoir",
    kind: "document",
    title: "Red envelope — Boudoir",
    tags: ["mail", "envelope"],
    reveal: (ctx) => ctx.flag("Red Envelope Boudoir"),
    summary: () => "A red envelope opened in the Boudoir.",
    detail: () => "The envelope is filed. Its text stays in your handwriting, not the catalog.",
  },
  {
    id: "doc-red-drawing",
    kind: "document",
    title: "Red envelope — Drawing Room",
    tags: ["mail", "envelope"],
    reveal: (ctx) => ctx.flag("Red Envelope Drawing"),
    summary: () => "A red envelope opened in the Drawing Room.",
    detail: () => "The envelope is filed. Annotate it on the Notes tab if you copied it down.",
  },
  {
    id: "doc-red-office",
    kind: "document",
    title: "Red envelope — Office",
    tags: ["mail", "envelope"],
    reveal: (ctx) => ctx.flag("Red Envelope Office"),
    summary: () => "A red envelope opened in the Office.",
    detail: () => "The envelope is filed.",
  },
  {
    id: "doc-drafting-5",
    kind: "document",
    title: "Drafting Strategy, Vol. 5",
    tags: ["book", "drafting"],
    reveal: (ctx) => ctx.flag("drafting strategy vol 5"),
    summary: () => "A drafting volume already read.",
    detail: () => "Volume 5 is on the shelf of this notebook. Later volumes stay off the page.",
  },
  {
    id: "doc-network-password",
    kind: "document",
    title: "Network terminal password",
    tags: ["terminal"],
    reveal: (ctx) => Boolean(ctx.str("NETWORK PASSWORD")),
    summary: (ctx) => `Known to this save: ${ctx.str("NETWORK PASSWORD")}`,
    detail: (ctx) => `The terminal accepts ${ctx.str("NETWORK PASSWORD")}. Written here because the save already holds it.`,
  },
  {
    id: "doc-gift-shop",
    kind: "document",
    title: "Gift shop",
    tags: ["shop"],
    reveal: (ctx) => ctx.flag("GiftShopSeen"),
    summary: () => "You have already browsed the gift shop.",
    detail: () => "A stop on the estate, filed because this save has seen it.",
  },
  {
    id: "sec-room-46",
    kind: "secret",
    title: "Room 46 reached",
    tags: ["estate"],
    reveal: (ctx) => ctx.flag("Room 46 Reached") || ctx.flag("46v") || ctx.room("ROOM 46") > 0,
    summary: () => "The numbered room at the end of the house.",
    detail: () => "Arrival is filed. What else the room might hold waits on a later save write.",
  },
  {
    id: "sec-vault-149",
    kind: "secret",
    title: "Vault 149 opened",
    tags: ["vault"],
    reveal: (ctx) => ctx.flag("149 Opened"),
    summary: () => "One vault door already opened.",
    detail: () => "Box 149 is open. Other numbers stay off this page.",
  },
  {
    id: "sec-orchard",
    kind: "secret",
    title: "Apple orchard",
    tags: ["estate"],
    reveal: (ctx) => ctx.flag("Apple Orchard Open"),
    summary: () => "The orchard gate has been opened.",
  },
  {
    id: "sec-cavern",
    kind: "secret",
    title: "Gemstone cavern",
    tags: ["underground"],
    reveal: (ctx) => ctx.flag("Gemstone Cavern Open"),
    summary: (ctx) =>
      ctx.num("Cavern Stability") > 0
        ? `Open. Stability filed at ${ctx.num("Cavern Stability")}.`
        : "The cavern is open.",
  },
  {
    id: "sec-west-gate",
    kind: "secret",
    title: "West gate",
    tags: ["estate"],
    reveal: (ctx) => ctx.flag("West Gate Open"),
    summary: () => "The west gate stands open.",
  },
  {
    id: "sec-outer-room",
    kind: "secret",
    title: "Outer room",
    tags: ["drafting"],
    reveal: (ctx) => ctx.flag("Outer Room Unlocked") || ctx.flag("?Outer Room"),
    summary: (ctx) =>
      ctx.num("Outer Drafts") > 0
        ? `Unlocked. Outer drafts filed: ${ctx.num("Outer Drafts")}.`
        : "The outer room is unlocked.",
  },
  {
    id: "sec-basement-1",
    kind: "secret",
    title: "Basement door I",
    tags: ["underground"],
    reveal: (ctx) => ctx.flag("Basement Door 1"),
    summary: () => "A basement door already opened.",
  },
  {
    id: "sec-basement-2",
    kind: "secret",
    title: "Basement door II",
    tags: ["underground"],
    reveal: (ctx) => ctx.flag("Basement Door 2"),
    summary: () => "A second basement door already opened.",
  },
  {
    id: "sec-grotto",
    kind: "secret",
    title: "Grotto",
    tags: ["underground"],
    reveal: (ctx) => ctx.flag("Grotto Open"),
    summary: () => "The grotto has been opened.",
  },
  {
    id: "sec-reservoir",
    kind: "secret",
    title: "Reservoir",
    tags: ["underground"],
    reveal: (ctx) => ctx.flag("Resevoir Seen") || ctx.num("Reservoir Level") > 0,
    summary: (ctx) =>
      ctx.num("Reservoir Level") > 0
        ? `Seen. Water level filed at ${ctx.num("Reservoir Level")}.`
        : "The reservoir has been seen.",
  },
  {
    id: "sec-room-8",
    kind: "secret",
    title: "Room 8 solved",
    tags: ["puzzle"],
    reveal: (ctx) => ctx.flag("Room 8 Solved") || ctx.room("ROOM 8") > 0,
    summary: () => "The puzzle in Room 8 is already solved.",
  },
  {
    id: "sec-gallery",
    kind: "secret",
    title: "Gallery boards",
    tags: ["puzzle", "gallery"],
    reveal: (ctx) =>
      ctx.flag("gallery5solve") ||
      ctx.flag("gallery6solve") ||
      ctx.flag("gallery7solve") ||
      ctx.flag("gallery8solve"),
    summary: (ctx) => {
      const n = [5, 6, 7, 8].filter((board) => ctx.flag(`gallery${board}solve`));
      return n.length ? `Solved boards: ${list(n.map(String))}.` : "Gallery work is filed.";
    },
  },
  {
    id: "sec-coat-check",
    kind: "secret",
    title: "Coat check",
    tags: ["items"],
    reveal: (ctx) => ctx.flag("CoatCheckFirstTime") || ctx.num("CoatCheckNumber") > 0,
    summary: (ctx) =>
      ctx.num("CoatCheckNumber") > 0
        ? `Ticket ${ctx.num("CoatCheckNumber")} is filed.`
        : "Coat check has been used.",
  },
  {
    id: "sec-keycard",
    kind: "secret",
    title: "Keycard desk",
    tags: ["items"],
    reveal: (ctx) => ctx.flag("?Keycard Door") || ctx.str("FirstCheckedItem") === "KEYCARD",
    summary: (ctx) =>
      ctx.str("FirstCheckedItem")
        ? `First checked item: ${ctx.str("FirstCheckedItem")}.`
        : "Keycard doors are known to this save.",
  },
  {
    id: "sec-allowance-tomb",
    kind: "secret",
    title: "Tomb allowance",
    tags: ["allowance"],
    reveal: (ctx) => ctx.flag("Allowance - Tomb"),
    summary: () => "An allowance tied to the Tomb is already claimed.",
  },
  {
    id: "sec-lunch-box",
    kind: "secret",
    title: "Lunch box",
    tags: ["items"],
    reveal: (ctx) => ctx.flag("lunch box"),
    summary: () => "A lunch box already found.",
  },
  {
    id: "sec-pool-gold",
    kind: "secret",
    title: "Pool gold",
    tags: ["items"],
    reveal: (ctx) => ctx.flag("PoolGoldPickedUp"),
    summary: () => "Gold from the pool has already been taken.",
  },
  {
    id: "sec-tomb-angel",
    kind: "secret",
    title: "Tomb angel wall",
    tags: ["tomb"],
    reveal: (ctx) => ctx.flag("Tomb Wall Angel Open"),
    summary: () => "The angel wall in the Tomb is open.",
  },
  {
    id: "sec-stars",
    kind: "secret",
    title: "Stars",
    tags: ["observatory"],
    reveal: (ctx) => ctx.flag("SeenStars") || ctx.flag("?Stars"),
    summary: (ctx) =>
      ctx.num("TotalStars") > 0 ? `Stars filed: ${ctx.num("TotalStars")}.` : "The stars have been seen.",
  },
  {
    id: "sec-antechamber",
    kind: "secret",
    title: "Antechamber entered",
    tags: ["estate"],
    reveal: (ctx) => ctx.flag("antechamber entered") || ctx.room("ANTECHAMBER") > 0,
    summary: () => "You have already entered the Antechamber.",
  },
  {
    id: "sec-security",
    kind: "secret",
    title: "Security drafted",
    tags: ["drafting"],
    reveal: (ctx) => ctx.flag("securitydrafted") || ctx.room("SECURITY") > 0,
    summary: () => "Security has been drafted into the house.",
  },
  {
    id: "sec-darkroom",
    kind: "secret",
    title: "Darkroom lamp",
    tags: ["rooms"],
    reveal: (ctx) => ctx.flag("first lit darkroom"),
    summary: () => "The Darkroom has been lit at least once.",
  },
  {
    id: "sec-parlor",
    kind: "secret",
    title: "Parlor boxes",
    tags: ["puzzle"],
    reveal: (ctx) => ctx.flag("ParlorSetup") || ctx.room("PARLOR") > 0,
    summary: (ctx) => {
      const bits = [];
      if (ctx.num("ParlorPuzzles Correct") > 0) bits.push(`${ctx.num("ParlorPuzzles Correct")} correct`);
      if (ctx.num("ParlorPuzzles Incorrect") > 0) bits.push(`${ctx.num("ParlorPuzzles Incorrect")} missed`);
      if (ctx.num("Parlor Score") > 0) bits.push(`score ${ctx.num("Parlor Score")}`);
      return bits.length ? `Parlor record: ${bits.join(", ")}.` : "The parlor boxes are known.";
    },
  },
  {
    id: "sec-darts",
    kind: "secret",
    title: "Billiard darts",
    tags: ["puzzle"],
    reveal: (ctx) => ctx.num("Darts Solved") > 0,
    summary: (ctx) => `Darts solved: ${ctx.num("Darts Solved")}.`,
  },
  {
    id: "sec-blackprint",
    kind: "secret",
    title: "Blackprint",
    tags: ["drafting"],
    reveal: (ctx) => ctx.flag("?Blackprint") || ctx.flag("PickedupBluePrint"),
    summary: () => "The house plan is in hand.",
  },
  {
    id: "sec-archived-floorplan",
    kind: "secret",
    title: "Archived floorplan",
    tags: ["drafting"],
    reveal: (ctx) => ctx.flag("?Archived Floorplan"),
    summary: () => "An archived floorplan is known to this save.",
  },
  {
    id: "sec-foreman",
    kind: "secret",
    title: "Foreman's door",
    tags: ["estate"],
    reveal: (ctx) => ctx.flag("Foremans Door"),
    summary: () => "The foreman's door has been opened.",
  },
  {
    id: "sec-brick-basement",
    kind: "secret",
    title: "Basement brick wall",
    tags: ["underground"],
    reveal: (ctx) => ctx.flag("BrickWall-Basement"),
    summary: () => "A basement brick wall has already been dealt with.",
  },
  {
    id: "sec-brick-garden",
    kind: "secret",
    title: "Secret Garden brick wall",
    tags: ["green"],
    reveal: (ctx) => ctx.flag("BrickWall-SecretGarden"),
    summary: () => "The Secret Garden wall is open.",
  },
  {
    id: "sec-gas-hovel",
    kind: "secret",
    title: "Hovel flame",
    tags: ["estate"],
    reveal: (ctx) => ctx.flag("Gas Flame - Hovel"),
    summary: () => "The hovel flame is lit.",
  },
  {
    id: "sec-gas-schoolhouse",
    kind: "secret",
    title: "Schoolhouse flame",
    tags: ["estate"],
    reveal: (ctx) => ctx.flag("Gas Flame - Schoolhouse"),
    summary: () => "The schoolhouse flame is lit.",
  },
  {
    id: "sec-time-lock",
    kind: "fact",
    title: "Time lock",
    tags: ["clock"],
    reveal: (ctx) => Boolean(ctx.str("Time Lock Month")),
    summary: (ctx) => {
      const hour = ctx.num("Time Lock Hour");
      const date = ctx.num("Time Lock Date");
      return `${ctx.str("Time Lock Month")} ${date || "—"} · ${hour}:00`;
    },
    detail: (ctx) =>
      `A time already noted by this save: ${ctx.str("Time Lock Month")} ${ctx.num("Time Lock Date")} at ${ctx.num("Time Lock Hour")}:00.`,
  },
  {
    id: "sec-sleep",
    kind: "fact",
    title: "Last bed",
    tags: ["day"],
    reveal: (ctx) => Boolean(ctx.str("sleeproom")),
    summary: (ctx) => ctx.str("sleeproom"),
  },
  {
    id: "sec-purchase",
    kind: "fact",
    title: "Largest purchase",
    tags: ["shop"],
    reveal: (ctx) => Boolean(ctx.str("largestpurchaseitem")),
    summary: (ctx) => {
      const shop = ctx.str("largestpurchaseshop");
      const price = ctx.num("largestpurchaseprice");
      return [ctx.str("largestpurchaseitem"), shop, price ? `${price} coins` : null]
        .filter(Boolean)
        .join(" · ");
    },
  },
  {
    id: "sec-allowance",
    kind: "fact",
    title: "Allowance",
    tags: ["day"],
    reveal: (ctx) => ctx.num("allowance") > 0 || ctx.flag("?Allowance"),
    summary: (ctx) => `${ctx.num("allowance")} coins each morning`,
  },
  {
    id: "sec-contraptions",
    kind: "secret",
    title: "Workshop contraptions",
    tags: ["workshop"],
    reveal: (ctx) => ctx.flag("?Contraption"),
    summary: () => "Contraptions are known to this save.",
  },
  {
    id: "sec-experiments",
    kind: "secret",
    title: "Laboratory experiments",
    tags: ["lab"],
    reveal: (ctx) => ctx.flag("?Experiment") || ctx.num("Total Experiments") > 0,
    summary: (ctx) =>
      ctx.num("Total Experiments") > 0
        ? `Experiments run: ${ctx.num("Total Experiments")}.`
        : "The laboratory's experiment table is known.",
  },
  {
    id: "sec-dig",
    kind: "secret",
    title: "Digging",
    tags: ["items"],
    reveal: (ctx) => ctx.flag("?Dig") || ctx.num("TotalDigs") > 0,
    summary: (ctx) => (ctx.num("TotalDigs") > 0 ? `Digs filed: ${ctx.num("TotalDigs")}.` : "A shovel has been used."),
  },
  {
    id: "sec-blessing",
    kind: "secret",
    title: "Shrine",
    tags: ["shrine"],
    reveal: (ctx) => ctx.flag("?Blessing") || ctx.room("SHRINE") > 0,
    summary: () => "The shrine is known. No active blessing is written in this save.",
  },
  {
    id: "sec-mjb-master",
    kind: "secret",
    title: "Mora Jai — Master Bedroom",
    tags: ["boxes"],
    reveal: (ctx) => ctx.flag("MJB - Master Bedroom"),
    summary: () => "A Mora Jai box in the Master Bedroom is already solved.",
  },
  {
    id: "sec-mjb-trading",
    kind: "secret",
    title: "Mora Jai — Trading Post",
    tags: ["boxes"],
    reveal: (ctx) => ctx.flag("MJB - Trading Post"),
    summary: () => "A Mora Jai box in the Trading Post is already solved.",
  },
  {
    id: "sec-day-after",
    kind: "fact",
    title: "The day after",
    tags: ["day"],
    reveal: (ctx) => ctx.flag("The Day After"),
    summary: () => "The day after has already happened.",
  },
  {
    id: "sec-draft-pool",
    kind: "secret",
    title: "Added to the draft pool",
    tags: ["drafting"],
    reveal: (ctx) => foundAdditions(ctx).length > 0,
    summary: (ctx) => list(foundAdditions(ctx)),
    detail: (ctx) =>
      `These floorplans are already in your pool: ${list(foundAdditions(ctx))}.`,
  },
];

function makeCtx(save: ParsedSave): Ctx {
  return {
    flag: (name) => Boolean(save.flags[name]),
    num: (name) => save.numbers[name] ?? 0,
    str: (name) => save.strings[name] ?? "",
    room: (name) => save.rooms[name.toUpperCase()] ?? 0,
  };
}

function materialize(def: CatalogDef, ctx: Ctx): RevealedEntry {
  return {
    id: def.id,
    kind: def.kind,
    title: def.title,
    summary: def.summary(ctx),
    detail: def.detail ? def.detail(ctx) : def.summary(ctx),
    tags: def.tags,
    complete: def.complete ? def.complete(ctx) : undefined,
  };
}

export function revealEntries(save: ParsedSave): RevealedEntry[] {
  const ctx = makeCtx(save);
  const revealed: RevealedEntry[] = [];
  for (const def of CATALOG) {
    if (!def.reveal(ctx)) continue;
    revealed.push(materialize(def, ctx));
  }
  return revealed;
}

export function revealRooms(save: ParsedSave): RoomEntry[] {
  return Object.entries(save.rooms)
    .filter(([, count]) => count > 0)
    .map(([name, count]) => ({
      name: titleCaseRoom(name),
      count,
      rarity: save.rarity[name] ?? save.rarity[name.toUpperCase()] ?? 0,
      category: ROOM_CATEGORIES[name.toUpperCase()] ?? "other",
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function emptyParsedSave(): ParsedSave {
  return {
    fingerprint: "empty",
    slot: "none",
    source: "json",
    fileName: "",
    path: "",
    mtime: null,
    saveCreated: null,
    gameVersion: null,
    day: 0,
    allowance: 0,
    flags: {},
    numbers: {},
    strings: {},
    rooms: {},
    rarity: {},
  };
}

export { titleCaseRoom, SANCTUM_DOORS, TROPHIES, UPGRADE_DISCS, DRAFT_ADDITIONS };
