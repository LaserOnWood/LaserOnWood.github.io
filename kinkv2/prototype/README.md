# KinkList

**KinkList** est une application web interactive qui permet d’explorer, de classer et de conserver ses préférences personnelles dans un espace simple, visuel et privé. Le site aide chaque personne à mieux cartographier ses envies, ses limites et ses curiosités, sans nécessiter de compte utilisateur ni de serveur applicatif pour l’usage courant.

> KinkList est un outil personnel d’exploration et d’organisation. Il ne remplace jamais le consentement explicite, la communication entre partenaires ni le respect des limites de chacun.

## Fonctionnalités

### Exploration guidée des préférences

Le site propose une liste organisée par catégories. Chaque élément peut être évalué progressivement selon plusieurs niveaux de préférence : **non sélectionné**, **adore**, **aime**, **curiosité**, **peu intéressé** et **non strict**. Cette navigation permet de construire une cartographie personnelle de manière progressive et intuitive.

Pour les personnes qui découvrent l’application, un **questionnaire guidé** accompagne l’exploration et facilite la première utilisation de KinkList.

### Recherche et navigation

Une recherche globale permet de retrouver rapidement un élément précis. Une navigation rapide par catégories et une interface organisée en sections rendent l’exploration confortable, même lorsque la liste contient de nombreuses entrées.

### Statistiques en temps réel

KinkList présente une synthèse visuelle des préférences renseignées. Les statistiques permettent de suivre l’évolution du profil au fil de la session et de mieux comprendre la répartition entre les différents niveaux de préférence.

### Import et export des préférences

Les préférences peuvent être **exportées** dans un fichier JSON afin de conserver une sauvegarde personnelle ou de les transférer vers un autre appareil. Un fichier JSON précédemment exporté peut également être **importé** dans l’application.

### Génération d’images récapitulatives

L’application peut générer une image de synthèse des résultats. Deux modes sont disponibles : une organisation par **catégories** ou une organisation par **types de préférences**. Cette fonctionnalité permet de conserver une représentation visuelle ou de la partager volontairement.

### Historique et stockage local

Les données de l’utilisateur sont gérées côté navigateur. Le stockage local et IndexedDB permettent de conserver les préférences et certaines informations de session sans transmettre automatiquement les données à un serveur distant.

### Interface adaptée aux appareils mobiles

KinkList utilise une interface responsive conçue pour fonctionner sur ordinateur, tablette et téléphone. Le manifeste de l’application permet également une utilisation de type application web progressive lorsque le navigateur le prend en charge.

## Utilisation

Le site est accessible depuis sa page principale : [`index.html`](./index.html). Pour l’utiliser localement, il suffit de servir le dossier avec un serveur HTTP statique, car certains navigateurs limitent le chargement des modules JavaScript et des fichiers JSON lorsque la page est ouverte directement avec le protocole `file://`.

Par exemple, avec Python :

```bash
python3 -m http.server 8080
```

Puis ouvrir [http://localhost:8080](http://localhost:8080) dans un navigateur.

## Structure du projet

| Répertoire ou fichier | Rôle |
| --- | --- |
| `index.html` | Page principale de l’application. |
| `css/style.css` | Styles et mise en page responsive. |
| `js/main.js` | Point d’entrée de l’architecture JavaScript modulaire. |
| `js/` | Modules de recherche, préférences, statistiques, historique, import/export et génération d’images. |
| `json/kink-data.json` | Données structurées des catégories et des éléments proposés. |
| `favicon/` | Icônes et ressources associées à l’application web progressive. |
| `og/` | Image Open Graph utilisée lors du partage du site. |
| `manifest.json` | Métadonnées de l’application web, notamment son nom, sa langue et ses couleurs. |
| `.github/workflows/sync-to-site.yml` | Synchronisation automatique vers `kinkv2/` dans le dépôt principal. |

## Technologies utilisées

KinkList est une application statique composée de HTML, CSS et JavaScript moderne organisé en modules ES. L’interface s’appuie notamment sur Bootstrap, Font Awesome et html2canvas pour la présentation, les icônes et la génération d’images récapitulatives. Les données de référence sont stockées dans un fichier JSON et les préférences personnelles sont traitées dans le navigateur.

## Confidentialité et consentement

KinkList est conçu pour un usage personnel. Les préférences sont manipulées localement par l’application et les fonctions d’export, d’import et de partage sont déclenchées volontairement par l’utilisateur. Avant de partager une liste ou une image, il est recommandé de vérifier qu’elle ne contient pas d’informations que l’on souhaite conserver privées.

L’utilisation de KinkList doit toujours s’inscrire dans une démarche fondée sur le consentement libre, éclairé, enthousiaste et réversible. Toute préférence ou tout résultat affiché dans l’application reste personnel et ne constitue jamais une obligation.

## Synchronisation avec le site principal

Le dépôt `kinklist` constitue la source dédiée de l’application. Le workflow GitHub Actions [`sync-to-site.yml`](./.github/workflows/sync-to-site.yml) synchronise automatiquement son contenu vers le dossier `kinkv2/` du dépôt principal [`LaserOnWood.github.io`](https://github.com/LaserOnWood/LaserOnWood.github.io) à chaque publication sur la branche `main`.

Pour que cette synchronisation fonctionne, le dépôt privé doit disposer d’un secret GitHub nommé `SITE_REPO_TOKEN`. Ce secret doit correspondre à un jeton autorisé à lire le dépôt privé `kinklist` et à publier les changements dans le dépôt principal.

## Licence et évolution

Ce dépôt contient la version dédiée de KinkList utilisée pour sa publication. Les évolutions peuvent concerner les catégories, l’interface, les statistiques, l’import/export, la génération d’images et les mécanismes de stockage local.
