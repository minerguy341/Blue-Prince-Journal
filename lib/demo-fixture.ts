import { createHash } from "node:crypto";

import type { ParsedSave } from "@/lib/types";

export const DEMO_TRUE_FLAGS = [
  "149 Opened",
  "46v",
  "?Addition",
  "?Allowance",
  "?Archived Floorplan",
  "?Blackprint",
  "?Blessing",
  "?Checked Item",
  "?Contraption",
  "?Dig",
  "?Dirigiblocks",
  "?Dirt",
  "?Drafting (Type)",
  "?Experiment",
  "?Hidden Riddle",
  "?Keycard Door",
  "?Luck",
  "?Outer Room",
  "?Power Source",
  "?Puzzle",
  "?Sanctum",
  "?Security Locked",
  "?Sigil",
  "?Spread",
  "?Stars",
  "?Trophy",
  "?Underground",
  "?Upgrade",
  "?West Path",
  "Allowance - Tomb",
  "Apple Orchard Open",
  "Basement Door 1",
  "Basement Door 2",
  "Basement Shelf Open",
  "Boiler A On",
  "Boiler B On",
  "Boiler C On",
  "Boiler Gate Up",
  "Boiler Switcher 1",
  "BrickWall-Basement",
  "BrickWall-SecretGarden",
  "Casino Added",
  "Classroom Added",
  "Clock Tower Added",
  "CoatCheckFirstTime",
  "Conservatory Added",
  "Dormitory Added",
  "Dovecote Added",
  "Foremans Door",
  "Foundation",
  "Foundation Elevator Down",
  "GEAR UP",
  "Gas Flame - Gemstone",
  "Gas Flame - Hovel",
  "Gas Flame - Orchard",
  "Gas Flame - Schoolhouse",
  "Gemstone Cavern Open",
  "GiftShopSeen",
  "Grotto Open",
  "LIFTER A - up",
  "LIFTER B - up",
  "Load Complete",
  "MJB - Master Bedroom",
  "MJB - Trading Post",
  "Mechanarium Added",
  "OFFICE MAIL",
  "Outer Room Unlocked",
  "ParlorSetup",
  "PickedupBluePrint",
  "Planetarium Added",
  "PoolGoldPickedUp",
  "Red Envelope Boudoir",
  "Red Envelope Drawing",
  "Red Envelope Office",
  "Resevoir Seen",
  "Room 46 Reached",
  "Room 8 Solved",
  "SeenStars",
  "Solarium Added",
  "The Day After",
  "The Kennel Added",
  "Tomb Wall Angel Open",
  "Trophy 8",
  "Trophy Inheritance",
  "Upgrade Disc - Commissary",
  "Upgrade Disc - Foundation",
  "Upgrade Disc - Garage",
  "Upgrade Disc - Great Hall",
  "Upgrade Disc - Master Bedroom",
  "Upgrade Disc - Morning Room",
  "Upgrade Disc - Office",
  "Upgrade Disc - Torch Room",
  "Vestibule Added",
  "West Gate Open",
  "antechamber entered",
  "day two bool",
  "drafting strategy vol 5",
  "first lit darkroom",
  "gallery5solve",
  "gallery6solve",
  "gallery7solve",
  "gallery8solve",
  "initial alllowance",
  "lunch box",
  "outeroom drafted",
  "sanctum door nuance",
  "sanctum door orinda aries",
  "sanctum key 1",
  "sanctum key 8",
  "securitydrafted",
] as const;

export const DEMO_STRINGS: Record<string, string> = {
  FirstCheckedItem: "KEYCARD",
  "Foundation Tile String E": "Tile 14",
  "Foundation Tile String S": "Tile 8",
  "Foundation Tile String W": "Tile 12",
  largestpurchaseitem: "Moon Pendant",
  largestpurchaseshop: "Showroom",
  "NETWORK PASSWORD": "SWANSONG",
  sleeproom: "Bedroom Closet",
  "Time Lock Month": "JAN",
};

export const DEMO_NUMBERS: Record<string, number> = {
  DAY: 59,
  allowance: 16,
  "Aquarium Level": 2,
  "AVERAGE DAY LENGTH": 1313.71,
  "Boiler Switcher 2": 3,
  "Cavern Stability": 95,
  "clock rooms": 1,
  CoatCheckNumber: 114,
  "Darts Solved": 22,
  "FoundationLocationV3.x": 35,
  "FoundationLocationV3.z": 35,
  "Greenhouse Level": 5,
  highestgrade: 3,
  "Kitchen Level": 3,
  largestpurchaseprice: 20,
  longestday: 6058.27,
  "Main Course Buff": 20,
  "Next Live Payroll Date": 57,
  "Outer Drafts": 41,
  "Parlor Number": 100,
  "Parlor Score": 12,
  ParlorA: 9,
  ParlorB: 11,
  ParlorC: 24,
  "ParlorPuzzles Correct": 33,
  "ParlorPuzzles Incorrect": 8,
  "Pool Level": 8,
  "Reservoir Level": 14,
  SaveSlot: 1,
  "Tank1 - PumpRoom": 4,
  "Tank2 - PumpRoom": 4,
  "Tank3- Pumproom": 6,
  "TCount Explorers": 101,
  "TDay 8": 51,
  "TDay Inheritance": 37,
  "The Dead End Record": 19,
  TheStandaloneRoomDraftedToday: 4,
  "Time Lock Date": 3,
  "Time Lock Hour": 10,
  Tithes: 79,
  "Total Experiments": 20,
  TotalBedrooms: 173,
  TotalCoinsSpent: 747,
  TotalDigs: 91,
  TotalGemsSpent: 298,
  TotalGreenrooms: 91,
  TotalHallways: 170,
  TotalKeysUsed: 156,
  TotalRedrooms: 148,
  TotalRooms: 1198,
  TotalShops: 67,
  TotalStars: 29,
  TotalStepsSpent: 2881,
  Troves: 1,
  "Upgrade Boudoir": 3,
  "Upgrade Closet": 2,
  "Upgrade Courtyard": 3,
  "Upgrade Guest Bedroom": 2,
  "Upgrade Nook": 1,
  "Upgrade Parlor": 1,
  "Upgrade Spare Room": 1,
  "Upgrade Storeroom": 3,
  "Upgrade Tally": 8,
  "upgrade disk moon": 4,
  YesterFreezerGold: 119,
};

const ROOM_TABLE = `
BEDROOM:50
PARLOR:44
DEN:43
CHAPEL:41
HALLWAY:41
NOOK:41
PANTRY:41
CLOSET:38
WORKSHOP:34
CORRIDOR:33
GUEST BEDROOM:32
STOREROOM:32
SECURITY:31
SPARE ROOM:31
COMMISSARY:28
UTILITY CLOSET:27
COURTYARD:26
DARKROOM:26
DRAWING ROOM:25
BILLIARD ROOM:22
GYMNASIUM:21
LABORATORY:20
DINING ROOM:19
LIBRARY:19
OBSERVATORY:19
WEST WING HALL:17
AQUARIUM:16
BOUDOIR:15
TOOLSHED:15
BOILER ROOM:14
BUNK ROOM:14
PASSAGEWAY:14
LAVATORY:13
NURSERY:12
FOYER:11
SECRET PASSAGE:11
GARAGE:10
SECRET GARDEN:10
ARCHIVES:9
COAT CHECK:9
HOVEL:9
KITCHEN:9
WEIGHT ROOM:9
CLOISTER:8
DRAFTING STUDIO:8
MUSIC ROOM:8
CLASSROOM:7
CONFERENCE ROOM:7
FURNACE:7
GREAT HALL:7
PATIO:7
TERRACE:7
VERANDA:7
WALK-IN CLOSET:7
MAID'S CHAMBER:6
MAIL ROOM:6
THE POOL:6
PLANETARIUM:5
EAST WING HALL:4
RUMPUS ROOM:4
SHRINE:4
STUDY:4
TRADING POST:4
VAULT:4
BOMB SHELTER:3
CHAMBER OF MIRRORS:3
CONSERVATORY:3
FREEZER:3
GIFT SHOP:3
GREENHOUSE:3
LOCKSMITH:3
OFFICE:3
PUMP ROOM:3
SAUNA:3
SCHOOLHOUSE:3
VESTIBULE:3
WINE CELLAR:3
ATTIC:2
BALLROOM:2
DOVECOTE:2
GALLERY:2
LAUNDRY ROOM:2
MASTER BEDROOM:2
MORNING ROOM:2
ROOT CELLAR:2
ROTUNDA:2
SERVANT'S QUARTERS:2
ANTECHAMBER:1
BOOKSHOP:1
CLOCK TOWER:1
DORMITORY:1
ENTRANCE HALL:1
HER LADYSHIP'S CHAMBER:1
MECHANARIUM:1
ROOM 46:1
ROOM 8:1
SHOWROOM:1
THE FOUNDATION:1
THE KENNEL:1
TOMB:1
TROPHY ROOM:1
`;

const RARITY_TABLE = `
ARCHIVES:4
BOILER ROOM:1
CORRIDOR:1
DINING ROOM:2
DORMITORY:3
DRAFTING STUDIO:1
FOYER:1
LABORATORY:1
PASSAGEWAY:1
SECURITY:1
UTILITY CLOSET:1
WORKSHOP:1
`;

function parseTable(table: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const line of table.trim().split("\n")) {
    const idx = line.lastIndexOf(":");
    out[line.slice(0, idx)] = Number(line.slice(idx + 1));
  }
  return out;
}

export const DEMO_ROOMS = parseTable(ROOM_TABLE);
export const DEMO_RARITY = parseTable(RARITY_TABLE);

export const DEMO_META = {
  slot: "BluePrint",
  saveCreated: "2025-10-01T23:11:00",
  gameVersion: "1.1.10.25",
  fileName: "blueprint-export.json",
};

export function demoFingerprint(): string {
  return createHash("sha256")
    .update(`${DEMO_META.slot}|${DEMO_META.saveCreated}|demo`)
    .digest("hex")
    .slice(0, 16);
}

export function buildDemoSave(path = "data/demo-storage/blueprint-export.json"): ParsedSave {
  const flags: Record<string, boolean> = {};
  for (const name of DEMO_TRUE_FLAGS) flags[name] = true;
  return {
    fingerprint: demoFingerprint(),
    slot: DEMO_META.slot,
    source: "demo",
    fileName: DEMO_META.fileName,
    path,
    mtime: new Date().toISOString(),
    saveCreated: DEMO_META.saveCreated,
    gameVersion: DEMO_META.gameVersion,
    day: DEMO_NUMBERS.DAY,
    allowance: DEMO_NUMBERS.allowance,
    flags,
    numbers: { ...DEMO_NUMBERS },
    strings: { ...DEMO_STRINGS },
    rooms: { ...DEMO_ROOMS },
    rarity: { ...DEMO_RARITY },
  };
}

export function demoExportJson(): Record<string, unknown> {
  const objs: Record<string, unknown> = {
    ...DEMO_NUMBERS,
    ...DEMO_STRINGS,
  };
  for (const name of DEMO_TRUE_FLAGS) objs[name] = true;
  return {
    source: "demo",
    slot: DEMO_META.slot,
    save_created: DEMO_META.saveCreated,
    game_version: DEMO_META.gameVersion,
    BluePrint: {
      value: { objs },
    },
    RoomRecords: DEMO_ROOMS,
    RarityShifts: DEMO_RARITY,
  };
}

export const DEMO_CHESS_NOTE = {
  id: "note-chess-precipice",
  title: "Chess puzzle in the Precipice",
  body: `Day 55 = Thursday, December 31st

Pawn:
Bedroom, Guest Bedroom, Nursery, Den, Storeroom, Dining Room, Drawing Room, Freezer, Parlor, Bunk Room, Drafting Studio, Walk-in Closet, Solarium, Dormitory, Lost & Found, Secret Passage

Knight:
Observatory, Security, Armory, Treasure Trove

Bishop:
Chapel, Attic, Bookshop, Rumpus Room

Rook:
Nook, Vault, Conservatory, Clock Tower

Queen:
Study, Her Ladyship's Chamber

King:
Office, Throne Room`,
  tags: ["chess", "precipice", "desktop"],
  pinned: true,
  linkedEntryId: null as string | null,
};
