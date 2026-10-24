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
  | 'camp'
  | 'trinket'
  | 'talisman';

export interface Link {
  labelRu: string;
  url: string;
}

export interface Meta {
  dataVersion: string;
  game: string;
  language: 'ru';
  generatedAt: string;
  notesRu: string;
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
  rulesRu: string[]; // how crafting works with this vendor
  categories: CategoryId[]; // category order on screen
}

export interface Category {
  id: CategoryId;
  nameRu: string;
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
  perfectKillRu: string; // how to kill (tactics for legendary animals)
  behaviorRu: string; // behaviour, time of day, tips
  unlockRu?: string; // legendary only: when it becomes available
  danger: 'safe' | 'aggressive' | 'dangerous';
  availability: 'story' | 'epilogue';
  availabilityNoteRu: string; // empty if there are no restrictions
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
  effectRu: string; // effect (satchels, trinkets, talismans), may be empty
  campSpotRu: string; // where it appears in camp (Pearson decorations), may be empty
  prerequisiteItemIds: string[]; // items that must be crafted first (only "Legend of the East")
  outfitIds: string[]; // outfits this item belongs to
  dataConfidence: 'high' | 'medium' | 'low';
  dataNoteRu: string;
}

export interface Outfit {
  id: string;
  nameRu: string;
  nameEn: string;
  itemIds: string[];
}

/** User state (section 7.1). */
export interface CraftRecord {
  at: string; // ISO date
  deducted: Record<string, number>; // how much was actually deducted
}

export interface UserState {
  schemaVersion: 1;
  crafted: Record<string, CraftRecord>; // key: item.id
  stock: Record<string, number>; // key: material.id; missing key = 0
  goals: { items: string[]; outfits: string[] };
  settings: { theme: 'night' | 'paper' | 'system'; showEnglish: boolean };
}
