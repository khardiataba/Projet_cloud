import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Snippet } from './models/Snippet.js';
import { User } from './models/User.js';
import { requireAuth } from './middleware/auth.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envFile = path.join(__dirname, '..', '.env');

dotenv.config({ path: envFile });

const PORT = process.env.PORT || 8080;
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Normalise les tags saisis sous forme de liste ou de texte CSV.
const normalizeTags = (tags) =>
  Array.isArray(tags)
    ? tags.map((tag) => String(tag).trim()).filter(Boolean)
    : String(tags || '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);

// Construit le filtre de recherche en fonction des parametres de requete.
const buildSearchQuery = ({ q, category, favorite }) => {
  const query = {};

  if (q) {
    const regex = new RegExp(q.trim(), 'i');
    query.$or = [
      { title: regex },
      { command: regex },
      { description: regex },
      { tags: regex }
    ];
  }

  if (category && category !== 'All') {
    query.category = category;
  }

  if (favorite === 'true') {
    query.favorite = true;
  }

  if (favorite === 'false') {
    query.favorite = false;
  }

  return query;
};

// Retire les champs sensibles avant de renvoyer l'utilisateur au client.
const sanitizeUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email
});

// Genere un JWT signe pour la session utilisateur.
const createToken = (user) => {
  if (!JWT_SECRET) {
    throw new Error('JWT secret is not configured');
  }

  return jwt.sign(
    {
      sub: user._id.toString(),
      name: user.name,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

app.get('/api/health', async (_req, res) => {
  const dbState = mongoose.connection.readyState;
  res.json({
    ok: true,
    database: dbState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime()
  });
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Le nom, l'e-mail et le mot de passe sont requis" });
    }

    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });

    if (existingUser) {
      return res.status(409).json({ message: 'Un utilisateur avec cet e-mail existe deja' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash
    });

    const token = createToken(user);
    return res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({
      message: "Impossible d'enregistrer l'utilisateur",
      error: error.message
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "L'e-mail et le mot de passe sont requis" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    const token = createToken(user);
    return res.json({ token, user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({
      message: 'Impossible de se connecter',
      error: error.message
    });
  }
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.sub);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({
      message: 'Impossible de charger le profil',
      error: error.message
    });
  }
});

app.get('/api/snippets', requireAuth, async (req, res) => {
  try {
    const query = buildSearchQuery(req.query);
    query.user = req.user.sub;
    const snippets = await Snippet.find(query).sort({
      favorite: -1,
      createdAt: -1
    });
    res.json(snippets);
  } catch (error) {
    res.status(500).json({
      message: 'Impossible de charger les extraits',
      error: error.message
    });
  }
});

app.post('/api/snippets', requireAuth, async (req, res) => {
  try {
    const { title, command, description, category, tags, favorite } = req.body;

    if (!title || !command) {
      return res.status(400).json({
        message: 'Le titre et la commande sont requis'
      });
    }

    const snippet = await Snippet.create({
      title: title.trim(),
      command: command.trim(),
      description: description?.trim() || '',
      category: category?.trim() || 'General',
      tags: normalizeTags(tags),
      favorite: Boolean(favorite),
      user: req.user.sub
    });

    res.status(201).json(snippet);
  } catch (error) {
    res.status(500).json({
      message: "Impossible de creer l'extrait",
      error: error.message
    });
  }
});

app.put('/api/snippets/:id', requireAuth, async (req, res) => {
  try {
    const { title, command, description, category, tags, favorite } = req.body;
    const updatedSnippet = await Snippet.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user.sub
      },
      {
        title: title?.trim(),
        command: command?.trim(),
        description: description?.trim() || '',
        category: category?.trim() || 'General',
        tags: normalizeTags(tags),
        favorite: Boolean(favorite)
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedSnippet) {
      return res.status(404).json({ message: 'Extrait introuvable' });
    }

    res.json(updatedSnippet);
  } catch (error) {
    res.status(500).json({
      message: "Impossible de mettre a jour l'extrait",
      error: error.message
    });
  }
});

app.delete('/api/snippets/:id', requireAuth, async (req, res) => {
  try {
    const deletedSnippet = await Snippet.findOneAndDelete({
      _id: req.params.id,
      user: req.user.sub
    });

    if (!deletedSnippet) {
      return res.status(404).json({ message: 'Extrait introuvable' });
    }

    res.json({ message: 'Extrait supprime' });
  } catch (error) {
    res.status(500).json({
      message: "Impossible de supprimer l'extrait",
      error: error.message
    });
  }
});

{
  const publicDir = path.join(__dirname, 'public');
  const indexFile = path.join(publicDir, 'index.html');

  // Sert le frontend compile en production ou quand le build existe deja localement.
  if (process.env.NODE_ENV === 'production' || fs.existsSync(indexFile)) {
    app.use(express.static(publicDir));
    app.get('*', (_req, res) => {
      res.sendFile(indexFile);
    });
  }
}

const startServer = async () => {
  try {
    const missingEnvVars = [];

    if (!MONGODB_URI) {
      missingEnvVars.push('MONGODB_URI');
    }

    if (!JWT_SECRET) {
      missingEnvVars.push('JWT_SECRET');
    }

    if (missingEnvVars.length > 0) {
      console.error(
        `Variables d'environnement requises manquantes : ${missingEnvVars.join(', ')}.`
      );
      console.error(`Cree un fichier .env a l'emplacement ${envFile} a partir de .env.example.`);
      process.exit(1);
    }

    await mongoose.connect(MONGODB_URI);
    console.log('Connecte a MongoDB');

    app.listen(PORT, () => {
      console.log(`L'API DevPulse tourne sur le port ${PORT}`);
    });
  } catch (error) {
    console.error('Echec du demarrage du serveur', error);
    process.exit(1);
  }
};

const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === __filename;

export { app };
export default app;

if (isMainModule) {
  startServer();
}
