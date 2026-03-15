# Mon Régime

Application web légère, pensée pour GitHub Pages et l'écran d'accueil de l'iPhone.

## Fonctions
- date du jour ou date choisie
- aliments mangés
- quantité
- calories consommées
- sport
- calories dépensées
- bilan nutritionnel simple
- suivi journalier du poids
- historique récent
- export / import JSON
- fonctionnement hors ligne après première ouverture

## Déploiement sur GitHub Pages
1. Crée un dépôt GitHub.
2. Envoie tous les fichiers de ce dossier à la racine du dépôt.
3. Va dans **Settings > Pages**.
4. Dans **Build and deployment**, choisis **Deploy from a branch**.
5. Sélectionne la branche **main** et le dossier **/root**.
6. Ouvre l'URL GitHub Pages sur iPhone dans Safari.
7. Appuie sur **Partager > Sur l’écran d’accueil**.

## Personnalisation
- le nom affiché sur l'iPhone est défini dans `manifest.webmanifest` et dans la balise `apple-mobile-web-app-title`
- les couleurs principales sont dans `styles.css`
- l'icône est `icon-180.png`
