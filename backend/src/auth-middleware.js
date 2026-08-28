/**
 * Middleware de autenticação por JWT.
 * Lê o token do cabeçalho "Authorization: Bearer <token>",
 * valida e coloca os dados do usuário em req.usuario.
 */
const jwt = require('jsonwebtoken');
const { SECRET } = require('./config');

function autenticar(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ erro: 'Token não enviado.' });
  }

  try {
    const payload = jwt.verify(token, SECRET);
    req.usuario = payload; // { id, nome, email }
    next();
  } catch (e) {
    return res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
}

module.exports = { autenticar };
