import test from 'node:test';
import assert from 'node:assert/strict';
import { DataLoader } from '../js/data-loader.js';
import { PreferencesManager } from '../js/preferences-manager.js';
import { HistoryManager } from '../js/history-manager.js';

test('le cycle de préférence revient à none après le dernier état', () => {
  const preferences = new PreferencesManager();
  let state = 'none';
  for (let index = 0; index < 5; index += 1) {
    state = preferences.getNextState(state);
  }
  assert.equal(state, 'non_strict');
  assert.equal(preferences.getNextState(state), 'none');
});

test('les préférences exportées reflètent uniquement les choix actifs', () => {
  const preferences = new PreferencesManager();
  preferences.setPreference('Item A', 'adore');
  preferences.setPreference('Item B', 'aime');
  preferences.setPreference('Item B', 'none');

  const result = preferences.generateExportData([
    { id: 'adore' },
    { id: 'aime' }
  ]);

  assert.deepEqual(result.preferences, { 'Item A': 'adore' });
  assert.equal(result.totalSelected, 1);
  assert.deepEqual(result.summary, { adore: 1, aime: 0 });
});

test('l’historique limite le nombre d’états et restaure une copie indépendante', () => {
  const history = new HistoryManager(2);
  const first = new Map([['A', 'adore']]);
  history.saveState(first, 'premier');
  first.set('A', 'aime');
  history.saveState(first, 'second');
  history.saveState(new Map([['A', 'curiosité']]), 'troisième');

  assert.equal(history.history.length, 2);
  assert.equal(history.history[0].action, 'second');
  const restored = history.undo();
  assert.equal(restored.get('A'), 'aime');
  restored.set('A', 'none');
  assert.equal(history.getStateAt(0).get('A'), 'aime');
  assert.ok(history.history[0].snapshot instanceof Map);
  assert.ok(history.history[1].changes instanceof Map);
});

test('un catalogue incomplet ou dupliqué est rejeté', () => {
  assert.throws(() => DataLoader.validateKinkData({ categories: [], preferenceTypes: [] }));
  assert.throws(() => DataLoader.validateKinkData({
    categories: [
      { id: 'same', name: 'Une', hasSubcategories: false, items: [] },
      { id: 'same', name: 'Deux', hasSubcategories: false, items: [] }
    ],
    preferenceTypes: [{ id: 'adore' }]
  }));
});

test('une importation ignore les états inconnus sans perdre les choix valides', () => {
  const imported = DataLoader.validateImportData({
    preferences: {
      'Valide': 'adore',
      'Invalide': 'inexistant',
      42: 'aime'
    }
  });

  assert.equal(imported.get('Valide'), 'adore');
  assert.equal(imported.has('Invalide'), false);
  assert.equal(imported.get('42'), 'aime');
});
