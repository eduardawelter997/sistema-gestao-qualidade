const { db } = require('./db');

function autorizarAdministrador(req, res, next) {
  const usuario = db
    .prepare('SELECT perfil, status FROM usuarios WHERE id = ?')
    .get(req.usuario.id);

  const autorizado =
    usuario &&
    usuario.status === 'Ativo' &&
    usuario.perfil &&
    usuario.perfil.toLowerCase() === 'administrador';

  if (!autorizado) {
    return res.status(403).json({
      erro: 'Acesso permitido somente para administradores.',
    });
  }

  next();
}

module.exports = { autorizarAdministrador };