# Validation locale du prototype

## Démarrage

Le prototype a été servi localement puis chargé dans Chromium le 17 août 2026. Le catalogue de référence a été chargé et validé, IndexedDB a été initialisée et le cache applicatif a été enregistré sans erreur de console.

| Vérification | Résultat |
| --- | --- |
| Démarrage de l’application | Réussi |
| Catalogue | 17 catégories chargées |
| Cache applicatif | Enregistré |
| Erreurs de console bloquantes | Aucune |
| Catégories visibles | 17 |

Les contrôles d’interaction, de rendu différé, de recherche et de persistance sont documentés dans les sections suivantes après leur exécution.

## Rendu différé

Avant l’ouverture d’une catégorie, le navigateur relevait **339 nœuds DOM**, **0 carte de préférence** et **0 section de contenu matérialisée**. L’ouverture de « Aspect physique » a ensuite rendu ses **16 cartes** sans erreur visible. Les modules optionnels de partage, questionnaire et génération d’images n’étaient pas chargés dans les ressources initiales.

## Préférences et compteurs incrémentaux

Le clic contrôlé sur une carte a produit l’état visuel `adore`, mis à jour le compteur de catégorie à **1/16** et le compteur global « J’adore » à **1**. La copie de secours `localStorage` était présente après l’interaction. Aucun message d’erreur n’a été relevé dans la console durant cette opération.

## Recherche globale

La recherche « musclé » a matérialisé le catalogue afin de conserver une recherche complète, puis a affiché **3 résultats visibles** sur **215 cartes rendues**. Ce comportement est volontaire : le démarrage reste léger ; une recherche globale bascule ensuite vers un catalogue complet filtrable.

## Persistance après rechargement

Après rechargement complet, les compteurs affichaient toujours **1** préférence « J’adore » et **1/16** dans sa catégorie. La console confirme le chargement d’**une préférence depuis IndexedDB**. Le mécanisme de sauvegarde différée, la copie locale de secours et le rendu différé sont donc compatibles sur le parcours vérifié.
