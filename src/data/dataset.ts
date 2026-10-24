import type {
  Animal,
  Category,
  Item,
  Material,
  Meta,
  Outfit,
  Region,
  Vendor,
} from './types';

/** All game data files in one bundle. */
export interface Dataset {
  meta: Meta;
  regions: Region[];
  vendors: Vendor[];
  categories: Category[];
  animals: Animal[];
  materials: Material[];
  items: Item[];
  outfits: Outfit[];
}
