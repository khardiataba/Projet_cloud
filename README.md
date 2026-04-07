# DevPulse

DevPulse est une application MERN qui sert de coffre partage pour les developpeurs. Elle permet de stocker des extraits de code, des commandes, des notes de deploiement et des rappels de projet dans un espace consultable et securise.

## Etat du projet

| Exigence | Etat | Notes |
| --- | --- | --- |
| Application MERN complete et testee | Oui | Le projet inclut une API Node/Express et un frontend React. |
| Backend connecte a MongoDB Atlas | Oui | Le backend utilise `MONGODB_URI`. |
| Compte Vercel et configuration du projet | Etape manuelle | Il faut encore creer et configurer le projet sur Vercel. |
| Cluster MongoDB Atlas configure | Etape manuelle | Cree le cluster et ajoute la chaine de connexion dans `.env`. |
| Secrets dans des variables d'environnement | Oui | `.env.example` documente `MONGODB_URI` et `JWT_SECRET`. |
| Build React de production | Oui | Le frontend est compile dans `server/public`. |
| Projet Vercel configure | Etape manuelle | A faire dans le tableau de bord Vercel. |
| Source de deploiement configuree | Etape manuelle | Connecte le depot GitHub dans Vercel. |
| Application deployee et testee | Partiel | L'application est prete, mais la validation finale depend de Vercel et de MongoDB. |
| Authentification utilisateur | Oui | Connexion, inscription, sessions JWT et donnees separees par utilisateur. |

## Pourquoi cette app

- Elle est utile a une equipe de developpeurs.
- Elle montre un vrai flux de travail MERN.
- Elle se deploie proprement avec MongoDB Atlas et une plateforme de deploiement comme Vercel.

## Fonctionnalites

- Creer, modifier, supprimer et marquer en favori des extraits de developpement.
- Rechercher par mot-cle et filtrer par categorie.
- Stocker des commandes, notes et tags dans MongoDB.
- Compiler le frontend React pour la production et le servir depuis Express.

## Installation locale

1. Cree un fichier `.env` a partir de `.env.example`.
2. Renseigne `MONGODB_URI` avec la chaine de connexion MongoDB Atlas.
3. Installe les dependances :

```bash
npm install
```

4. Lance l'application :

```bash
npm run dev
```

## Build de production

```bash
npm run build
npm start
```

Si tu testes en local, lance le build avant `npm start` pour que `server/public` contienne le frontend a jour.

## Deploiement Vercel

### Configuration conseillee

1. Cree un projet dans Vercel a partir du depot GitHub.
2. Definis les variables d'environnement dans Vercel :
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `NODE_ENV=production`
3. Lance un build frontend avec `npm run build` si tu deploies le front compile depuis ce depot.
4. Verifie que l'application pointe vers l'API correcte si le backend est heberge ailleurs.
5. Apres le deploiement, ouvre l'URL Vercel et teste la connexion, l'inscription et le chargement des extraits.

### Details d'execution

- Le backend ecoute sur `process.env.PORT`.
- `npm start` lance seulement l'API ; le frontend doit deja etre compile dans `server/public`.
- Le build frontend est genere dans `server/public` via `npm run build`.
- Si tu gardes cette architecture monolithique, Vercel est surtout adapte au frontend, et l'API Express doit etre hebergee ou exposee de maniere compatible.

## Authentification

- Cree un compte developpeur depuis l'ecran de connexion.
- Connecte-toi avec ton e-mail et ton mot de passe pour acceder a ton coffre prive.
- Chaque utilisateur voit uniquement ses propres extraits.
