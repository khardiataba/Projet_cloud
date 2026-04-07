import jwt from 'jsonwebtoken';

export const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!token) {
    return res.status(401).json({ message: 'Authentification requise' });
  }

  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return res.status(500).json({ message: 'Le secret JWT n\'est pas configure' });
    }

    req.user = jwt.verify(token, secret);
    return next();
  } catch (_error) {
    return res.status(401).json({ message: 'Jeton invalide ou expire' });
  }
};
