/**
 * Rotas de autenticação: cadastro, login e dados do usuário logado.
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { db } = require('../db');
const { SECRET, TOKEN_EXPIRA_EM, CODIGO_RECUPERACAO_MESTRE } = require('../config');
const { autenticar } = require('../auth-middleware');

const router = express.Router();

function converterData(data) {
  if (!data) {
    return new Date().toISOString().split('T')[0];
  }

  const partes = data.split('/');

  if (partes.length === 3) {
    return `${partes[2]}-${partes[1]}-${partes[0]}`;
  }

  return data;
}

// Remove o hash da senha antes de devolver o usuário para o app
function limparUsuario(u) {
  if (!u) return null;
  const { senha_hash, ...resto } = u;
  return resto;
}

/**
 * POST /api/auth/register
 * Cria um novo usuário e já devolve um token (login automático).
 */
router.post('/register', (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: 'Informe nome, e-mail e senha.' });
  }

  const jaExiste = db
    .prepare('SELECT id FROM usuarios WHERE email = ?')
    .get(email.toLowerCase());

  if (jaExiste) {
    return res.status(409).json({ erro: 'Este e-mail já está cadastrado.' });
  }

  const senha_hash = bcrypt.hashSync(senha, 10);

  const info = db
    .prepare('INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)')
    .run(nome, email.toLowerCase(), senha_hash);

  const usuario = db
    .prepare('SELECT * FROM usuarios WHERE id = ?')
    .get(info.lastInsertRowid);

  const token = jwt.sign(
    { id: usuario.id, nome: usuario.nome, email: usuario.email },
    SECRET,
    { expiresIn: TOKEN_EXPIRA_EM }
  );

  res.status(201).json({ token, usuario: limparUsuario(usuario) });
});

/**
 * POST /api/auth/login
 * Confere e-mail e senha e devolve um token.
 */
router.post('/login', (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'Informe e-mail e senha.' });
  }

  const usuario = db
    .prepare('SELECT * FROM usuarios WHERE email = ?')
    .get(email.toLowerCase());

  if (!usuario || !bcrypt.compareSync(senha, usuario.senha_hash)) {
    return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
  }

  if (usuario.status === 'Pendente') {
    return res.status(403).json({
      erro: 'Este acesso ainda não foi ativado. Use "Primeiro acesso" com a senha inicial cadastrada pelo gestor.',
    });
  }

  const token = jwt.sign(
    { id: usuario.id, nome: usuario.nome, email: usuario.email },
    SECRET,
    { expiresIn: TOKEN_EXPIRA_EM }
  );

  res.json({ token, usuario: limparUsuario(usuario) });
});

/**
 * GET /api/auth/me
 * Retorna os dados do usuário logado (usado na tela "Mais").
 */
router.get('/me', autenticar, (req, res) => {
  const usuario = db
    .prepare('SELECT * FROM usuarios WHERE id = ?')
    .get(req.usuario.id);

  if (!usuario) {
    return res.status(404).json({ erro: 'Usuário não encontrado.' });
  }

  res.json({ usuario: limparUsuario(usuario) });
});

/**
 * POST /api/auth/cadastrar-colaborador
 * Permite que um gestor cadastre um novo colaborador informando cargo, setor e perfil.
 */
router.post('/cadastrar-colaborador', autenticar, (req, res) => {
  const { nome, email, senha, perfil, setor } = req.body;

  if (!nome || !email || !senha || !perfil || !setor) {
    return res.status(400).json({ erro: 'Preencha todos os campos obrigatórios.' });
  }

  const jaExiste = db
    .prepare('SELECT id FROM usuarios WHERE email = ?')
    .get(email.toLowerCase());

  if (jaExiste) {
    return res.status(409).json({ erro: 'Este e-mail já está cadastrado.' });
  }

  const senha_hash = bcrypt.hashSync(senha, 10);

  // Insere o colaborador preenchendo as colunas específicas da tabela usuarios.
  // Status "Pendente": o colaborador só fica com o acesso liberado depois de
  // ativar pela tela "Primeiro acesso", usando essa mesma senha inicial.
  const info = db
    .prepare(`
      INSERT INTO usuarios (nome, email, senha_hash, cargo, setor, perfil, status)
      VALUES (?, ?, ?, ?, ?, ?, 'Pendente')
    `)
    .run(nome, email.toLowerCase(), senha_hash, perfil, setor, perfil);

  const usuarioCriado = db
    .prepare('SELECT * FROM usuarios WHERE id = ?')
    .get(info.lastInsertRowid);

  res.status(201).json({
    mensagem: 'Colaborador cadastrado com sucesso!',
    usuario: limparUsuario(usuarioCriado)
  });
});

/**
 * POST /api/auth/ativar-acesso
 * Ativa o acesso de um colaborador cadastrado por um gestor (status
 * "Pendente"), conferindo a senha inicial. Já devolve token (login
 * automático), igual ao /login.
 */
router.post('/ativar-acesso', (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: 'Informe nome, e-mail e senha inicial.' });
  }

  const usuario = db
    .prepare('SELECT * FROM usuarios WHERE email = ?')
    .get(email.toLowerCase());

  if (!usuario) {
    return res.status(404).json({ erro: 'Nenhum acesso encontrado para este e-mail.' });
  }

  if (usuario.status !== 'Pendente') {
    return res.status(409).json({ erro: 'Este acesso já foi ativado. Use a tela de login.' });
  }

  if (!bcrypt.compareSync(senha, usuario.senha_hash)) {
    return res.status(401).json({ erro: 'Senha inicial incorreta.' });
  }

  db.prepare("UPDATE usuarios SET nome = ?, status = 'Ativo' WHERE id = ?")
    .run(nome, usuario.id);

  const usuarioAtivado = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(usuario.id);

  const token = jwt.sign(
    { id: usuarioAtivado.id, nome: usuarioAtivado.nome, email: usuarioAtivado.email },
    SECRET,
    { expiresIn: TOKEN_EXPIRA_EM }
  );

  res.json({ token, usuario: limparUsuario(usuarioAtivado) });
});

/**
 * POST /api/auth/verificar-codigo
 * Confere o código padrão de recuperação de senha (fixo, não há servidor
 * de e-mail configurado) e se o e-mail informado existe.
 */
router.post('/verificar-codigo', (req, res) => {
  const { email, codigo } = req.body;

  if (!email || !codigo) {
    return res.status(400).json({ erro: 'Informe o e-mail e o código.' });
  }

  const usuario = db
    .prepare('SELECT id FROM usuarios WHERE email = ?')
    .get(email.toLowerCase());

  if (!usuario) {
    return res.status(404).json({ erro: 'Nenhuma conta encontrada para este e-mail.' });
  }

  if (codigo !== CODIGO_RECUPERACAO_MESTRE) {
    return res.status(400).json({ erro: 'Código de recuperação inválido.' });
  }

  res.json({ valido: true });
});

/**
 * POST /api/auth/redefinir-senha
 * Revalida o código padrão de recuperação e grava a nova senha.
 */
router.post('/redefinir-senha', (req, res) => {
  const { email, codigo, novaSenha } = req.body;

  if (!email || !codigo || !novaSenha) {
    return res.status(400).json({ erro: 'Informe o e-mail, o código e a nova senha.' });
  }

  if (codigo !== CODIGO_RECUPERACAO_MESTRE) {
    return res.status(400).json({ erro: 'Código de recuperação inválido.' });
  }

  const usuario = db
    .prepare('SELECT * FROM usuarios WHERE email = ?')
    .get(email.toLowerCase());

  if (!usuario) {
    return res.status(404).json({ erro: 'Nenhuma conta encontrada para este e-mail.' });
  }

  const novoHash = bcrypt.hashSync(novaSenha, 10);
  db.prepare('UPDATE usuarios SET senha_hash = ? WHERE id = ?').run(novoHash, usuario.id);

  res.json({ mensagem: 'Senha redefinida com sucesso!' });
});

/**
 * GET /api/auth/colaboradores
 * Retorna a lista de todos os usuários cadastrados para exibir na gestão.
 */
router.get('/colaboradores', autenticar, (req, res) => {
  const colaboradores = db
    .prepare('SELECT id, nome, email, cargo, setor, perfil, status, criado_em FROM usuarios')
    .all();

  res.json({ colaboradores });
});

router.patch('/desativar-colaborador/:id', autenticar, (req, res) => {
  try {
    const { id } = req.params;

    // Atualiza o status do colaborador no banco SQLite
    const info = db
      .prepare('UPDATE usuarios SET status = ? WHERE id = ?')
      .run('Inativo', id);

    if (info.changes === 0) {
      return res.status(404).json({ erro: 'Colaborador não encontrado.' });
    }

    return res.status(200).json({ mensagem: 'Colaborador desativado com sucesso!' });
  } catch (error) {
    console.log('Erro ao desativar colaborador:', error);
    return res.status(500).json({ erro: 'Erro interno ao desativar colaborador.' });
  }
});

router.patch('/ativar-colaborador/:id', autenticar, (req, res) => {
  try {
    const { id } = req.params;

    const info = db
      .prepare('UPDATE usuarios SET status = ? WHERE id = ?')
      .run('Ativo', id);

    if (info.changes === 0) {
      return res.status(404).json({ erro: 'Colaborador não encontrado.' });
    }

    return res.status(200).json({ mensagem: 'Colaborador ativado com sucesso!' });
  } catch (error) {
    console.log('Erro ao ativar colaborador:', error);
    return res.status(500).json({ erro: 'Erro interno ao ativar colaborador.' });
  }
});

router.patch('/atualizar-perfil-setor/:id', autenticar, (req, res) => {
  try {
    const { id } = req.params;
    const { perfil, setor } = req.body;

    const info = db
      .prepare('UPDATE usuarios SET perfil = ?, setor = ? WHERE id = ?')
      .run(perfil, setor, id);

    if (info.changes === 0) {
      return res.status(404).json({ erro: 'Colaborador não encontrado.' });
    }

    return res.status(200).json({ mensagem: 'Dados atualizados com sucesso!' });
  } catch (error) {
    console.log('Erro ao atualizar perfil/setor:', error);
    return res.status(500).json({ erro: 'Erro interno ao atualizar dados.' });
  }
});

router.put('/me', autenticar, (req, res) => {
  try {
    // 🔍 Correção: O middleware preenche req.usuario.id e não req.usuarioId
    const usuarioId = req.usuario.id; 
    const { nome, email } = req.body;

    if (!nome || !email) {
      return res.status(400).json({ erro: 'Nome e e-mail são obrigatórios.' });
    }

    const info = db
      .prepare('UPDATE usuarios SET nome = ?, email = ? WHERE id = ?')
      .run(nome, email.toLowerCase(), usuarioId);

    if (info.changes === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    return res.status(200).json({ mensagem: 'Perfil atualizado com sucesso!' });
  } catch (error) {
    console.log('Erro ao atualizar perfil:', error);
    return res.status(500).json({ erro: 'Erro interno ao atualizar perfil.' });
  }
});

/**
 * PUT /api/auth/senha
 * Altera a senha do usuário logado após conferir a senha atual.
 */
router.put('/senha', autenticar, (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { senhaAtual, novaSenha } = req.body;

    if (!senhaAtual || !novaSenha) {
      return res.status(400).json({ erro: 'Informe a senha atual e a nova senha.' });
    }

    const usuario = db
      .prepare('SELECT * FROM usuarios WHERE id = ?')
      .get(usuarioId);

    if (!usuario || !bcrypt.compareSync(senhaAtual, usuario.senha_hash)) {
      return res.status(401).json({ erro: 'A senha atual está incorreta.' });
    }

    const novoHash = bcrypt.hashSync(novaSenha, 10);

    db.prepare('UPDATE usuarios SET senha_hash = ? WHERE id = ?')
      .run(novoHash, usuarioId);

    return res.status(200).json({ mensagem: 'Senha alterada com sucesso!' });
  } catch (error) {
    console.log('Erro ao alterar senha:', error);
    return res.status(500).json({ erro: 'Erro interno ao alterar senha.' });
  }
});

/**
 * GET /api/clientes-fornecedores
 * Retorna a lista de clientes e fornecedores cadastrados.
 */
router.get('/clientes-fornecedores', autenticar, (req, res) => {
  try {
    const lista = db.prepare('SELECT * FROM clientes_fornecedores ORDER BY nome ASC').all();
    return res.status(200).json({ clientesFornecedores: lista });
  } catch (error) {
    console.log('Erro ao buscar clientes e fornecedores:', error);
    return res.status(500).json({ erro: 'Erro interno ao buscar registros.' });
  }
});

const TIPOS_CANONICOS = [
  { valor: 'op', rotulo: 'OP' },
  { valor: 'ocorrencia', rotulo: 'Ocorrência' },
  { valor: 'acao', rotulo: 'Ação' },
  { valor: 'recebimento', rotulo: 'Recebimento' },
];

const SETORES_CANONICOS = ['Produção', 'Qualidade', 'Almoxarifado', 'Laminação', 'Corte', 'Acabamento'];

router.get('/indicadores', autenticar, (req, res) => {
  try {
    const { inicio, fim, clienteId, filtro } = req.query;

    const inicioFormatado = converterData(inicio);
    const fimFormatado = converterData(fim);

    // Clientes e fornecedores ficam salvos na mesma tabela `registros`
    // (são cadastro, não eventos da qualidade), então precisam ficar de
    // fora de todo indicador — senão entram na contagem por período/setor.
    const filtros = [
        "tipo NOT IN ('cliente', 'fornecedor')",
        `date(
        substr(data, 7, 4) || '-' ||
        substr(data, 4, 2) || '-' ||
        substr(data, 1, 2)
      ) BETWEEN date(?) AND date(?)`,
    ];

    const parametros = [inicioFormatado, fimFormatado];

    if (clienteId) {
      filtros.push('cliente_fornecedor_id = ?');
      parametros.push(clienteId);
    }

    const where = filtros.join(' AND ');

    // Tempo médio de resolução: média de dias entre a criação e a conclusão
    // das ocorrências concluídas dentro do período (data de conclusão real,
    // não a mesma coluna "data" usada nos outros filtros).
    const filtrosConcluido = [
      "tipo = 'ocorrencia'",
      'concluido_em IS NOT NULL',
      'date(concluido_em) BETWEEN date(?) AND date(?)',
    ];
    const parametrosConcluido = [inicioFormatado, fimFormatado];
    if (clienteId) {
      filtrosConcluido.push('cliente_fornecedor_id = ?');
      parametrosConcluido.push(clienteId);
    }
    const tempoMedioLinha = db
      .prepare(`
        SELECT AVG(julianday(concluido_em) - julianday(criado_em)) AS media
        FROM registros
        WHERE ${filtrosConcluido.join(' AND ')}
      `)
      .get(...parametrosConcluido);

    const totalOps = db
      .prepare(`SELECT COUNT(*) AS total FROM registros WHERE ${where} AND tipo = 'op'`)
      .get(...parametros).total;

    const totalOcorrenciasPeriodo = db
      .prepare(`SELECT COUNT(*) AS total FROM registros WHERE ${where} AND tipo = 'ocorrencia'`)
      .get(...parametros).total;

    const resumo = {
      opsEmAndamento: db
        .prepare(`
          SELECT COUNT(*) AS total
          FROM registros
          WHERE ${where}
            AND tipo = 'op'
            AND status = 'Em andamento'
        `)
        .get(...parametros).total,

      ocorrenciasAbertas: db
        .prepare(`
          SELECT COUNT(*) AS total
          FROM registros
          WHERE ${where}
            AND tipo = 'ocorrencia'
            AND status = 'Aberta'
        `)
        .get(...parametros).total,

      acoesAtrasadas: db
        .prepare(`
          SELECT COUNT(*) AS total
          FROM registros
          WHERE ${where}
            AND tipo = 'acao'
            AND status = 'Atrasada'
        `)
        .get(...parametros).total,

      recebimentosProblemas: db
        .prepare(`
          SELECT COUNT(*) AS total
          FROM registros
          WHERE ${where}
            AND tipo = 'recebimento'
            AND com_problema = 1
        `)
        .get(...parametros).total,

      taxaNaoConformidade:
        totalOps > 0 ? Math.round((totalOcorrenciasPeriodo / totalOps) * 100) : 0,

      tempoMedio:
        tempoMedioLinha.media != null ? `${tempoMedioLinha.media.toFixed(1)} dias` : 'Sem dados',
    };

    // O gráfico muda de acordo com a aba escolhida: por mês (padrão), por
    // tipo de registro, ou por setor/processo.
    let labels;
    let valores;

    if (filtro === 'tipo') {
      const contagens = db
        .prepare(`SELECT tipo, COUNT(*) AS total FROM registros WHERE ${where} GROUP BY tipo`)
        .all(...parametros);
      const mapa = Object.fromEntries(contagens.map((l) => [l.tipo, l.total]));
      labels = TIPOS_CANONICOS.map((t) => t.rotulo);
      valores = TIPOS_CANONICOS.map((t) => mapa[t.valor] || 0);
    } else if (filtro === 'setor') {
      const contagens = db
        .prepare(`SELECT processo, COUNT(*) AS total FROM registros WHERE ${where} GROUP BY processo`)
        .all(...parametros);
      const mapa = {};
      let semSetor = 0;
      contagens.forEach((l) => {
        if (l.processo && SETORES_CANONICOS.includes(l.processo)) {
          mapa[l.processo] = l.total;
        } else {
          semSetor += l.total;
        }
      });
      labels = [...SETORES_CANONICOS, 'Sem setor'];
      valores = [...SETORES_CANONICOS.map((s) => mapa[s] || 0), semSetor];
    } else {
      const registrosPorMes = db
        .prepare(`
          SELECT
            CAST(substr(data, 4, 2) AS INTEGER) AS mes,
            COUNT(*) AS total
          FROM registros
          WHERE ${where}
          GROUP BY mes
          ORDER BY mes
        `)
        .all(...parametros);

      labels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      valores = Array(12).fill(0);
      registrosPorMes.forEach((registro) => {
        valores[registro.mes - 1] = registro.total;
      });
    }

    const maiorValor = Math.max(...valores, 1);
    const alturas = valores.map((valor) =>
      valor === 0 ? 4 : Math.max((valor / maiorValor) * 90, 8)
    );

    res.json({
      resumo,
      grafico: {
        labels,
        valores,
        alturas,
      },
    });
  } catch (error) {
    console.log('Erro ao gerar indicadores:', error);
    res.status(500).json({
      erro: 'Erro interno ao gerar indicadores.',
    });
  }
});

module.exports = router;
