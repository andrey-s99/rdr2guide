export type RegionId = 'ambarino' | 'new_hanover' | 'lemoyne' | 'west_elizabeth' | 'new_austin';
export type VendorId = 'trapper' | 'pearson' | 'fence';
export type CategoryId =
  | 'hat'
  | 'coat'
  | 'vest'
  | 'gloves'
  | 'boots'
  | 'chaps'
  | 'hat_accessory'
  | 'saddle'
  | 'satchel'
  | 'trinket'
  | 'talisman';

export interface Link {
  labelRu: string;
  labelEn: string;
  url: string;
}

export interface Meta {
  dataVersion: string;
  game: string;
  language: 'ru';
  generatedAt: string;
  notesRu: string;
  notesEn: string;
  sources: string[];
  globalMapLinks: Link[];
}

export interface Region {
  id: RegionId;
  nameRu: string;
  nameEn: string;
}

export interface Vendor {
  id: VendorId;
  nameRu: string;
  nameEn: string;
  locationsRu: string[]; // where to find the vendor
  locationsEn: string[];
  rulesRu: string[]; // how crafting works with this vendor
  rulesEn: string[];
  categories: CategoryId[]; // category order on screen
}

export interface Category {
  id: CategoryId;
  nameRu: string;
  nameEn: string;
  vendorId: VendorId;
  icon: string;
}

export interface Animal {
  id: string;
  type: 'regular' | 'bird' | 'legendary';
  nameRu: string;
  nameEn: string;
  size: 'small' | 'medium' | 'large';
  regions: RegionId[]; // regions[0] is the primary region (used for grouping)
  habitatRu: string; // where to look (exact spot for legendary animals)
  habitatEn: string;
  perfectKillRu: string; // how to kill (tactics for legendary animals)
  perfectKillEn: string;
  behaviorRu: string; // behaviour, time of day, tips
  behaviorEn: string;
  unlockRu?: string; // legendary only: when it becomes available
  unlockEn?: string;
  danger: 'safe' | 'aggressive' | 'dangerous';
  availability: 'story' | 'epilogue';
  availabilityNoteRu: string; // empty if there are no restrictions
  availabilityNoteEn: string;
  links: Link[]; // external links: maps, guides
}

export interface Material {
  id: string;
  nameRu: string;
  nameEn: string;
  kind: 'skin' | 'feather' | 'carcass' | 'antler' | 'legendary_pelt' | 'legendary_part' | 'special';
  quality: 'perfect' | 'any' | 'legendary';
  animalId: string | null; // null only for kind = 'special'
  consumedOnCraft: boolean; // false only for legendary_pelt
  sourceRu: string; // how to obtain
  sourceEn: string;
}

export interface RecipeEntry {
  materialId: string;
  qty: number;
}

export interface Item {
  id: string;
  vendorId: VendorId;
  category: CategoryId;
  nameRu: string;
  nameEn: string;
  price: number | null;
  recipe: RecipeEntry[];
  requirementRu: string; // recipe unlock condition, may be empty
  requirementEn: string;
  effectRu: string; // effect (trinkets, talismans), may be empty
  effectEn: string;
  campSpotRu: string; // where it appears in camp, may be empty
  campSpotEn: string;
  prerequisiteItemIds: string[]; // items that must be crafted first (only "Legend of the East")
  outfitIds: string[]; // outfits this item belongs to
  dataConfidence: 'high' | 'medium' | 'low';
  dataNoteRu: string;
  dataNoteEn: string;
}

export interface Outfit {
  id: string;
  nameRu: string;
  nameEn: string;
  itemIds: string[];
}

/**
 * English texts layered over the game data (src/data/en.json). The original
 * data/*.json files hold Russian descriptions; the UI shows the English ones.
 */
export interface EnglishTexts {
  meta: { notes: string; globalMapLinks: string[] };
  categories: Record<string, string>;
  vendors: Record<string, { locations: string[]; rules: string[] }>;
  animals: Record<
    string,
    {
      habitat: string;
      perfectKill: string;
      behavior: string;
      unlock?: string;
      availabilityNote: string;
      links: string[];
    }
  >;
  materials: Record<string, string>;
  items: Record<string, { requirement?: string; effect?: string; dataNote?: string }>;
}

/** Challenges (data/challenges.json is not part of the original data set). */
export type ChallengeCategoryId =
  | 'bandit'
  | 'explorer'
  | 'gambler'
  | 'herbalist'
  | 'horseman'
  | 'master_hunter'
  | 'sharpshooter'
  | 'survivalist'
  | 'weapons_expert';

export interface ChallengeRank {
  rank: number; // 1..10
  text: string; // challenge description as shown in the game
  reward: string; // item unlocked at the Trapper, or XP and cash
  guide: string; // how to do it quickly
}

export interface ChallengeCategory {
  id: ChallengeCategoryId;
  name: string;
  /** What starts the category (the first rank activates on this action). */
  unlock: string;
  /** Reinforced equipment set, the attribute it raises and other category rewards. */
  reward: string;
  /** General tips for the whole category. */
  tips: string[];
  ranks: ChallengeRank[];
}

/** User state (section 7.1). */
export interface CraftRecord {
  at: string; // ISO date
  deducted: Record<string, number>; // how much was actually deducted
}

/**
 * Materials held by each vendor. The Trapper crafts only from pelts sold to him and
 * Pearson only from pelts donated to him, so the two never share a pelt.
 * Key: vendor id, then material.id; missing key = 0.
 */
export type VendorStocks = Record<VendorId, Record<string, number>>;

export interface UserState {
  schemaVersion: 3;
  crafted: Record<string, CraftRecord>; // key: item.id; deducted from the item's vendor stock
  stock: VendorStocks;
  goals: { items: string[]; outfits: string[] };
  /** Completed challenge ranks per category (0..10); challenges are done in order. */
  challenges: Partial<Record<ChallengeCategoryId, number>>;
  settings: { theme: 'night' | 'paper' | 'system' };
}
