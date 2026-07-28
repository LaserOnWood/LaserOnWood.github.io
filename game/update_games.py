import os
import json

def update_games():
    game_dir = os.path.dirname(os.path.abspath(__file__))
    games = []
    
    # Parcourir les dossiers dans le répertoire game
    for item in os.listdir(game_dir):
        item_path = os.path.join(game_dir, item)
        # On vérifie si c'est un dossier et s'il contient un index.html
        if os.path.isdir(item_path) and os.path.exists(os.path.join(item_path, 'index.html')):
            games.append({
                "name": item,
                "path": item + "/",
                "description": f"Jeu {item}"
            })
    
    # Trier par nom
    games.sort(key=lambda x: x['name'])
    
    # Sauvegarder dans un fichier JSON
    with open(os.path.join(game_dir, 'games.json'), 'w', encoding='utf-8') as f:
        json.dump(games, f, indent=4, ensure_ascii=False)
    
    print(f"Mise à jour réussie : {len(games)} jeux trouvés.")

if __name__ == "__main__":
    update_games()
