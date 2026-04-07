# DevPulse

DevPulse est une application MERN qui sert de coffre partage pour les developpeurs. Elle permet de stocker des extraits de code, des commandes, des notes de deploiement et des rappels de projet dans un espace consultable et securise.

## Etat du projet

| Exigence | Etat | Notes |
| --- | --- | --- |
| Application MERN complete et testee | Oui | Le projet inclut une API Node/Express et un frontend React. |
| Backend connecte a MongoDB Atlas | Oui | Le backend utilise `MONGODB_URI`. |
| Compte Azure et configuration du portail | Etape manuelle | Il faut encore creer et configurer l'App Service dans Azure. |
| Cluster MongoDB Atlas configure | Etape manuelle | Cree le cluster et ajoute la chaine de connexion dans `.env`. |
| Secrets dans des variables d'environnement | Oui | `.env.example` documente `MONGODB_URI` et `JWT_SECRET`. |
| Build React de production | Oui | Le frontend est compile dans `server/public`. |
| Web app Azure creee | Etape manuelle | A faire dans le portail Azure. |
| Source de deploiement configuree | Etape manuelle | Choisis GitHub, Local Git ou une autre source de deploiement. |
| Application deployee et testee | Partiel | L'application est prete, mais la validation finale depend d'Azure et de MongoDB. |
| Authentification utilisateur | Oui | Connexion, inscription, sessions JWT et donnees separees par utilisateur. |

## Pourquoi cette app

- Elle est utile a une equipe de developpeurs.
- Elle montre un vrai flux de travail MERN.
- Elle se deploie proprement sur Azure App Service avec MongoDB Atlas.

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

## Deploiement Azure

### Configuration conseillee dans le portail

1. Cree une App Service Web App dans le portail Azure.
2. Choisis une version Node.js LTS recente, supportee dans ta region.
3. Utilise de preference l'hebergement Linux.
4. Dans `Settings > Configuration > Application settings`, ajoute :
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `NODE_ENV=production`
   - `SCM_DO_BUILD_DURING_DEPLOYMENT=true`
5. Dans `Settings > Configuration > General settings`, garde `npm start` comme commande de demarrage si Azure la demande.
6. Dans `Deployment Center`, connecte :
   - soit un depot GitHub avec deploiement continu,
   - soit Local Git si tu veux pousser depuis ta machine.
7. Apres le deploiement, ouvre le domaine par defaut et verifie que l'interface React se charge et que l'endpoint de sante retourne un etat correct.

### Details d'execution

- Le backend ecoute sur `process.env.PORT`.
- `npm start` lance seulement l'API ; le frontend doit deja etre compile dans `server/public`.
- Le build frontend est genere dans `server/public` via `npm run build`.
- Oryx et App Service peuvent executer `npm run build` si le depot contient un script `build`.

## Authentification

- Cree un compte developpeur depuis l'ecran de connexion.
- Connecte-toi avec ton e-mail et ton mot de passe pour acceder a ton coffre prive.
- Chaque utilisateur voit uniquement ses propres extraits.
