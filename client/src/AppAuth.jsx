import { useEffect, useMemo, useState } from 'react';

const emptyForm = {
  title: '',
  command: '',
  description: '',
  category: 'Backend',
  tags: '',
  favorite: false
};

const authEmpty = {
  name: '',
  email: '',
  password: ''
};

const categoryOptions = [
  { value: 'All', label: 'Toutes' },
  { value: 'Backend', label: 'Back-end' },
  { value: 'Frontend', label: 'Front-end' },
  { value: 'DevOps', label: 'DevOps' },
  { value: 'Productivity', label: 'Productivité' },
  { value: 'Database', label: 'Base de données' },
  { value: 'General', label: 'Général' }
];
const favoriteFilterOptions = [
  { value: 'all', label: 'Toutes' },
  { value: 'true', label: 'Favoris' },
  { value: 'false', label: 'Non favoris' }
];
const tokenKey = 'devpulse_token';
const userKey = 'devpulse_user';

const getCategoryLabel = (value) =>
  categoryOptions.find((option) => option.value === value)?.label || value;

function AppAuth() {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(userKey);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem(tokenKey) || '');
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState(authEmpty);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(Boolean(token));
  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [favoriteFilter, setFavoriteFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const activeSnippet = useMemo(
    () => snippets.find((snippet) => snippet._id === editingId) || null,
    [editingId, snippets]
  );

  // Construit les en-têtes HTTP pour les appels API authentifiés.
  const authHeaders = (includeJson = true) => {
    const headers = {
      Authorization: `Bearer ${token}`
    };

    if (includeJson) {
      headers['Content-Type'] = 'application/json';
    }

    return headers;
  };

  const persistSession = (nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem(tokenKey, nextToken);
    localStorage.setItem(userKey, JSON.stringify(nextUser));
  };

  const clearSession = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(userKey);
  };

  // Petit wrapper pour centraliser la gestion des réponses JSON et des erreurs API.
  const fetchJson = async (url, options = {}) => {
    const response = await fetch(url, options);
    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : null;

    if (!response.ok) {
      throw new Error(data?.message || 'La requête a échoué');
    }

    return data;
  };

  const loadProfile = async () => {
    if (!token) {
      setAuthLoading(false);
      return;
    }

    try {
      const data = await fetchJson('/api/auth/me', {
        headers: authHeaders(false)
      });
      if (data?.user) {
        setUser(data.user);
        localStorage.setItem(userKey, JSON.stringify(data.user));
      }
    } catch (profileError) {
      clearSession();
      setAuthError(profileError.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const loadSnippets = async () => {
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (categoryFilter !== 'All') params.set('category', categoryFilter);
      if (favoriteFilter !== 'all') params.set('favorite', favoriteFilter);

      const queryString = params.toString();
      const data = await fetchJson(`/api/snippets${queryString ? `?${queryString}` : ''}`, {
        headers: authHeaders(false)
      });

      setSnippets(data);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (!token || authLoading) return;
    loadSnippets();
  }, [token, query, categoryFilter, favoriteFilter, authLoading]);

  useEffect(() => {
    if (!activeSnippet) return;

    setForm({
      title: activeSnippet.title || '',
      command: activeSnippet.command || '',
      description: activeSnippet.description || '',
      category: activeSnippet.category || 'General',
      tags: Array.isArray(activeSnippet.tags) ? activeSnippet.tags.join(', ') : '',
      favorite: Boolean(activeSnippet.favorite)
    });
  }, [activeSnippet]);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload = authMode === 'login'
        ? { email: authForm.email, password: authForm.password }
        : authForm;

      const data = await fetchJson(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      persistSession(data.token, data.user);
      setAuthForm(authEmpty);
    } catch (authSubmitError) {
      setAuthError(authSubmitError.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    setSnippets([]);
    setForm(emptyForm);
    setEditingId(null);
    setQuery('');
    setCategoryFilter('All');
    setFavoriteFilter('all');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = {
        title: form.title,
        command: form.command,
        description: form.description,
        category: form.category,
        tags: form.tags,
        favorite: form.favorite
      };

      await fetchJson(editingId ? `/api/snippets/${editingId}` : '/api/snippets', {
        method: editingId ? 'PUT' : 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });

      resetForm();
      await loadSnippets();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (snippetId) => {
    if (!window.confirm('Supprimer cet extrait ?')) return;

    try {
      await fetchJson(`/api/snippets/${snippetId}`, {
        method: 'DELETE',
        headers: authHeaders(false)
      });

      if (editingId === snippetId) {
        resetForm();
      }

      await loadSnippets();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  const handleEdit = (snippet) => {
    setEditingId(snippet._id);
    setForm({
      title: snippet.title || '',
      command: snippet.command || '',
      description: snippet.description || '',
      category: snippet.category || 'General',
      tags: Array.isArray(snippet.tags) ? snippet.tags.join(', ') : '',
      favorite: Boolean(snippet.favorite)
    });
  };

  const handleCopy = async (command) => {
    try {
      await navigator.clipboard.writeText(command);
    } catch (_error) {
      setError('La copie dans le presse-papiers a echoue');
    }
  };

  const stats = useMemo(() => {
    const uniqueCategories = new Set(snippets.map((snippet) => snippet.category).filter(Boolean));
    return {
      total: snippets.length,
      favorites: snippets.filter((snippet) => snippet.favorite).length,
      categories: uniqueCategories.size
    };
  }, [snippets]);

  if (!token || authLoading) {
    return (
      <div className="app-shell">
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />

        <main className="container auth-layout">
          <section className="hero card auth-hero">
            <div className="hero-copy">
              <span className="eyebrow">DevPulse</span>
              <h1>Un coffre partagé pour les développeurs, sécurisé par des comptes personnels.</h1>
              <p>
                Connecte-toi pour garder tes commandes, notes et conseils de déploiement dans un
                espace privé qui te suit partout.
              </p>
              <div className="hero-stats">
                <div>
                  <strong>1</strong>
                  <span>compte par développeur</span>
                </div>
                <div>
                  <strong>JWT</strong>
                  <span>sessions protégées</span>
                </div>
                <div>
                  <strong>Atlas</strong>
                  <span>stockage cloud</span>
                </div>
              </div>
            </div>

            <div className="hero-panel">
              <div className="panel-header">
                <span>Accès sécurisé</span>
                <span>Prêt pour l'équipe</span>
              </div>
              <ul>
                <li>Crée ton compte en quelques secondes.</li>
                <li>Stocke les extraits de code en privé par utilisateur.</li>
                <li>Utilise le même coffre sur Azure App Service.</li>
              </ul>
            </div>
          </section>

          <section className="card auth-card">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Acces</span>
                <h2>{authMode === 'login' ? 'Connexion' : 'Creer un compte'}</h2>
              </div>
              <button
                type="button"
                className="ghost-button"
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              >
                {authMode === 'login' ? "Besoin d'un compte ?" : 'Tu as deja un compte ?'}
              </button>
            </div>

            <form className="form-grid auth-form" onSubmit={handleAuthSubmit}>
              {authMode === 'register' ? (
                <label className="full-row">
                  Nom
                  <input
                    type="text"
                    value={authForm.name}
                    onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })}
                    placeholder="Ton nom"
                    required
                  />
                </label>
              ) : null}

              <label className="full-row">
                E-mail
                <input
                  type="email"
                  value={authForm.email}
                  onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })}
                  placeholder="developpeur@entreprise.com"
                  required
                />
              </label>

              <label className="full-row">
                Mot de passe
                <input
                  type="password"
                  value={authForm.password}
                  onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })}
                  placeholder="Choisis un mot de passe solide"
                  required
                />
              </label>

              <button className="primary-button full-row" type="submit">
                {authMode === 'login' ? 'Se connecter' : 'Créer le compte'}
              </button>
            </form>

            {authError ? <p className="error-banner">{authError}</p> : null}
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <main className="container">
        <section className="hero card">
          <div className="hero-copy">
            <span className="eyebrow">DevPulse</span>
            <h1>Un coffre partagé pour les commandes, extraits et notes utiles à tout développeur.</h1>
            <p>
              Bon retour{user?.name ? `, ${user.name}` : ''}. Enregistre les meilleures commandes,
              partage tes conseils de déploiement et fais gagner du temps à ton équipe.
            </p>
            <div className="hero-stats">
              <div>
                <strong>{stats.total}</strong>
                <span>extraits</span>
              </div>
              <div>
                <strong>{stats.favorites}</strong>
                <span>favoris</span>
              </div>
              <div>
                <strong>{stats.categories}</strong>
                <span>catégories</span>
              </div>
            </div>
          </div>

          <div className="hero-panel">
            <div className="panel-header">
              <span>{user?.name || 'Développeur'}</span>
              <button type="button" className="ghost-button" onClick={handleLogout}>
                Déconnexion
              </button>
            </div>
            <ul>
              <li>Des extraits privés liés à ton compte.</li>
              <li>MongoDB Atlas stocke tes données de façon sécurisée.</li>
              <li>Azure App Service peut servir cette même version.</li>
            </ul>
          </div>
        </section>

        <section className="toolbar card">
          <div className="search-group">
            <label htmlFor="query">Recherche</label>
            <input
              id="query"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cherche une commande, une note ou un tag..."
            />
          </div>

          <div className="search-group">
            <label htmlFor="category">Catégorie</label>
            <select
              id="category"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="search-group">
            <label htmlFor="favorite">Favoris</label>
            <select
              id="favorite"
              value={favoriteFilter}
              onChange={(event) => setFavoriteFilter(event.target.value)}
            >
              {favoriteFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="workspace">
          <form className="card form-panel" onSubmit={handleSubmit}>
            <div className="section-heading">
              <div>
                <span className="eyebrow">Editeur</span>
                <h2>{editingId ? 'Modifier un extrait' : 'Ajouter un extrait'}</h2>
              </div>
              {editingId ? (
                <button type="button" className="ghost-button" onClick={resetForm}>
                  Annuler
                </button>
              ) : null}
            </div>

            <div className="form-grid">
              <label>
                Titre
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  placeholder="Exemple : Déployer sur Azure"
                  required
                />
              </label>

              <label>
                Catégorie
                <select
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value })}
                >
                  {categoryOptions
                    .filter((option) => option.value !== 'All')
                    .map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                </select>
              </label>

              <label className="full-row">
                Commande ou extrait
                <textarea
                  value={form.command}
                  onChange={(event) => setForm({ ...form, command: event.target.value })}
                  placeholder="npm run build"
                  required
                  rows={5}
                />
              </label>

              <label className="full-row">
                Description
                <textarea
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  placeholder="Quand l'utiliser et pourquoi il est utile."
                  rows={3}
                />
              </label>

              <label className="full-row">
                Tags
                <input
                  type="text"
                  value={form.tags}
                  onChange={(event) => setForm({ ...form, tags: event.target.value })}
                  placeholder="azure, déploiement, node"
                />
              </label>

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={form.favorite}
                  onChange={(event) => setForm({ ...form, favorite: event.target.checked })}
                />
                Marquer comme favori
              </label>
            </div>

            <div className="actions">
              <button className="primary-button" type="submit" disabled={saving}>
                {saving ? 'Enregistrement...' : editingId ? 'Mettre à jour' : 'Ajouter'}
              </button>
              <button type="button" className="secondary-button" onClick={resetForm}>
                Réinitialiser
              </button>
            </div>

            {error ? <p className="error-banner">{error}</p> : null}
          </form>

          <section className="card list-panel">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Bibliothèque</span>
                <h2>Extraits enregistrés</h2>
              </div>
              <span className="list-badge">{snippets.length} éléments</span>
            </div>

            {loading ? (
              <p className="empty-state">Chargement des extraits...</p>
            ) : snippets.length === 0 ? (
              <div className="empty-state">
                <h3>Aucun extrait trouvé</h3>
                <p>Ajoute ton premier conseil pour commencer le coffre partagé.</p>
              </div>
            ) : (
              <div className="snippet-grid">
                {snippets.map((snippet) => (
                  <article key={snippet._id} className={`snippet-card ${snippet.favorite ? 'favorite' : ''}`}>
                    <div className="snippet-top">
                      <div>
                        <span className="snippet-category">{getCategoryLabel(snippet.category)}</span>
                        <h3>{snippet.title}</h3>
                      </div>
                      {snippet.favorite ? <span className="favorite-pill">Favori</span> : null}
                    </div>

                    <p className="snippet-description">
                      {snippet.description || 'Aucune description fournie.'}
                    </p>

                    <pre className="snippet-command">{snippet.command}</pre>

                    <div className="tag-row">
                      {snippet.tags?.map((tag) => (
                        <span key={`${snippet._id}-${tag}`} className="tag-pill">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="snippet-actions">
                      <button type="button" onClick={() => handleCopy(snippet.command)}>
                        Copier
                      </button>
                      <button type="button" onClick={() => handleEdit(snippet)}>
                        Modifier
                      </button>
                      <button type="button" onClick={() => handleDelete(snippet._id)}>
                        Supprimer
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {error ? <p className="error-banner">{error}</p> : null}
          </section>
        </section>
      </main>
    </div>
  );
}

export default AppAuth;
