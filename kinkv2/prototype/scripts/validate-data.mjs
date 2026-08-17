import { readFile } from 'node:fs/promises';
import { DataLoader } from '../js/data-loader.js';

const source = new URL('../json/kink-data.json', import.meta.url);
const data = JSON.parse(await readFile(source, 'utf8'));
DataLoader.validateKinkData(data);

const itemNames = new Set();
let itemCount = 0;
for (const category of data.categories) {
  const groups = category.hasSubcategories ? category.subcategories : [category];
  for (const group of groups) {
    for (const rawItem of group.items) {
      const itemName = typeof rawItem === 'string' ? rawItem : rawItem?.name;
      if (!itemName || typeof itemName !== 'string') {
        throw new Error(`Item invalide dans la catégorie ${category.id}.`);
      }
      if (itemNames.has(itemName)) {
        throw new Error(`Item dupliqué : ${itemName}.`);
      }
      itemNames.add(itemName);
      itemCount += 1;
    }
  }
}

const preferenceTypeIds = new Set();
for (const type of data.preferenceTypes) {
  if (!type?.id || preferenceTypeIds.has(type.id)) {
    throw new Error(`Type de préférence invalide ou dupliqué : ${type?.id ?? 'absent'}.`);
  }
  preferenceTypeIds.add(type.id);
}

console.log(`Catalogue valide : ${data.categories.length} catégories, ${itemCount} items uniques, ${preferenceTypeIds.size} types de préférence.`);
