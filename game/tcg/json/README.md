# Modifier les cartes du TCG

Le fichier `cartes.json` contient **toutes les données éditables** des cartes. Pour ajouter ou modifier une carte, il suffit d’éditer ce fichier, puis de publier les changements. Le JavaScript du jeu n’a pas besoin d’être modifié.

| Champ | Rôle | Exemple |
|---|---|---|
| `id` | Numéro unique de la carte. Ne pas réutiliser un identifiant existant. | `7` |
| `passwordHash` | Hash SHA-256 du mot de passe normalisé (minuscules, sans espaces inutiles). | `"…"` |
| `hint` | Indice affiché au dos de la carte verrouillée. | `"Je suis caché…"` |
| `title` | Titre affiché après le déverrouillage. | `"La Surprise"` |
| `image` | URL absolue ou chemin relatif de l’illustration. | `"images/carte-07.jpg"` |
| `description` | Texte ou gage révélé par la carte. | `"…"` |
| `rarity` | Rareté visuelle. Valeurs recommandées : `Commun`, `Rare`, `Épique`, `Légendaire`, `Mythique`. | `"Rare"` |

> Le fichier est du JSON strict : il ne faut pas ajouter de commentaires, et une virgule est requise entre deux cartes, sauf après la dernière.

> Comme les données sont chargées avec `fetch`, ouvrez le jeu via GitHub Pages ou un serveur local HTTP. L’ouverture directe de `index.html` avec une adresse commençant par `file://` peut empêcher le navigateur de lire le JSON.

## Générer un hash de mot de passe

Après le chargement du jeu dans un navigateur, ouvrez la console puis saisissez :

```js
await genererHash("mon-mot-de-passe")
```

Copiez le résultat dans `passwordHash`. Ne placez jamais le mot de passe en clair dans `cartes.json`.
