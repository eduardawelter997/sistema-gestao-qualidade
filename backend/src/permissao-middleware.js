const { db } = require('./db');

const permissoesValidas = new Set([
  'registrar_recebimentos',
  'cadastrar_clientes',
  'adicionar_fotos',
  'registrar_problemas',
  'definir_causa_raiz',
  'encerrar_acoes',
  'avaliar_eficacia',
]);

function usuarioTemPermissao(usuarioId, nomePermissao) {
  if (!permissoesValidas.has(nomePermissao)) {
    throw new Error(`Permissão inválida: ${nomePermissao}`);
  }

  const permissao = db
    .prepare(`
      SELECT p.${nomePermissao} AS permitido
      FROM permissoes_usuario p
      INNER JOIN usuarios u ON u.id = p.usuario_id
      WHERE p.usuario_id = ?
        AND u.status = 'Ativo'
    `)
    .get(usuarioId);

  return permissao?.permitido === 1;
}

function exigirPermissao(nomePermissao) {
  if (!permissoesValidas.has(nomePermissao)) {
    throw new Error(`Permissão inválida: ${nomePermissao}`);
  }

  return (req, res, next) => {

    if (!usuarioTemPermissao(req.usuario.id, nomePermissao)) {
        return res.status(403).json({
            erro: 'Você não possui permissão para executar esta ação.',
        });
    }

    next();
  };
}

module.exports = { exigirPermissao, usuarioTemPermissao, };