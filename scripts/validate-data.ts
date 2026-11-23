// Data integrity check (SPEC 6.4). Uses relative imports so it runs under plain tsx.
import meta from '../data/meta.json';
import regions from '../data/regions.json';
import vendors from '../data/vendors.json';
import categories from '../data/categories.json';
import animals from '../data/animals.json';
import materials from '../data/materials.json';
import items from '../data/items.json';
import outfits from '../data/outfits.json';
import en from '../src/data/en.json';
import challenges from '../src/data/challenges.json';
import type { Dataset } from '../src/data/dataset';
import type { ChallengeCategory, EnglishTexts } from '../src/data/types';
import { validateChallenges, validateDataset, validateEnglish } from '../src/data/validate';

const dataset = {
  meta,
  regions,
  vendors,
  categories,
  animals,
  materials,
  items,
  outfits,
} as unknown as Dataset;

const errors = [
  ...validateDataset(dataset),
  ...validateEnglish(dataset, en as EnglishTexts),
  ...validateChallenges(challenges as unknown as ChallengeCategory[]),
];
if (errors.length > 0) {
  console.error(`Data validation failed (${errors.length} error(s)):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(
  `Data OK: ${dataset.items.length} items, ${dataset.materials.length} materials, ` +
    `${dataset.animals.length} animals, ${dataset.outfits.length} outfits, ` +
    `${challenges.length} challenge categories, English texts complete.`,
);
