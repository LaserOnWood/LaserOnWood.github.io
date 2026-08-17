# Prototype d’optimisations KinkList

Ce répertoire est une **copie isolée** de l’application, destinée à l’évaluation des améliorations avant toute intégration dans la version principale. Il n’est pas publié et n’a fait l’objet d’aucun commit ni push.

## Améliorations incluses

| Ordre | Domaine | Implémentation du prototype |
| --- | --- | --- |
| 1 | Chargement des données | Délai explicite, validation de schéma, cache IndexedDB et catalogue de secours. |
| 2 | Sauvegarde | Copie `localStorage` immédiate, écriture IndexedDB regroupée, vidage sur changement de visibilité et fermeture. |
| 3 | Données personnalisées | Échappement des sélecteurs CSS issus des libellés d’items. |
| 4 | Qualité | Script de validation du catalogue, tests unitaires Node.js et workflow CI prêt à promouvoir. |
| 5 | Démarrage | Suppression de Popper redondant, générateurs d’image, partage et questionnaire chargés uniquement lorsqu’ils sont utilisés. |
| 6 | Rendu | Cartes de préférence créées lors de l’ouverture d’une section ; la recherche globale les matérialise uniquement lorsqu’elle en a besoin. |
| 7 | Statistiques | Compteurs globaux et par catégorie tenus dans un cache incrémental. |
| 8 | Ressources | Manifeste PWA unique, service worker versionné, CSP, SRI sur les CDN et image Open Graph réduite. |
| 9 | Mémoire | Historique fondé sur un instantané initial et des différences ; génération d’image via `Blob`. |

## Vérifier localement

L’application ne requiert aucune installation de dépendance pour ses contrôles :

```bash
cd prototype
npm run verify
```

Le contrôle exécute la syntaxe JavaScript, la validation de `json/kink-data.json` et les tests unitaires. Les résultats des essais navigateur sont consignés dans [`VALIDATION.md`](./VALIDATION.md).

## Promouvoir vers la version principale

Une intégration éventuelle doit être revue fichier par fichier. Lorsque le prototype est jugé satisfaisant, il faut d’abord déplacer ou adapter son contenu à la racine du dépôt, puis déplacer `ci/quality.yml` vers `.github/workflows/quality.yml`. Le workflow de synchronisation existant devra ensuite exécuter `npm run verify` **avant** de copier et publier les fichiers.

> Le prototype ne doit pas être copié aveuglément : les URLs Open Graph actuellement utilisées conservent l’URL de production existante et doivent être confirmées lors de la promotion.
