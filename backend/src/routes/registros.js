/**
 * Rotas dos registros da qualidade (OPs, ocorrências, ações, recebimentos)
 * e do dashboard. Alimentam as telas Início, Busca e Favoritos.
 */
const express = require('express');
const { db } = require('../db');
const { autenticar } = require('../auth-middleware');
const { upload } = require('../upload');

const router = express.Router();

// Todas as rotas abaixo exigem usuário autenticado
router.use(autenticar);

/**
 * GET /api/dashboard
 * Números da "Visão geral" + registros recentes (tela Início).
 */
router.get('/dashboard', (req, res) => {
  const contar = (sql, ...params) =>
    db.prepare(`SELECT COUNT(*) AS n FROM registros ${sql}`).get(...params).n;

  const overview = {
    opsEmAndamento: contar("WHERE tipo = 'op' AND status = 'Em andamento'"),
    ocorrenciasAbertas: contar("WHERE tipo = 'ocorrencia' AND status = 'Aberta'"),
    acoesAtrasadas: contar("WHERE status = 'Atrasada'"),
    aguardandoAvaliacao: contar("WHERE status = 'Aguardando avaliação'"),
  };

  const recentes = db
    .prepare('SELECT * FROM registros WHERE op_id IS NULL ORDER BY id DESC LIMIT 5')
    .all();

  res.json({ overview, recentes });
});

/**
 * GET /api/registros?tipo=op&q=texto
 * Lista registros com filtro opcional por tipo e por busca textual (tela Busca).
 */
router.get('/registros', (req, res) => {
  const { tipo, q } = req.query;
  const where = ['op_id IS NULL'];
  const params = [];

  if (tipo && tipo !== 'todos') {
    where.push('tipo = ?');
    params.push(tipo);
  }
  if (q) {
    where.push('(codigo LIKE ? OR titulo LIKE ? OR descricao LIKE ?)');
    const like = `%${q}%`;
    params.push(like, like, like);
  }

  const sql =
    'SELECT * FROM registros' +
    (where.length ? ' WHERE ' + where.join(' AND ') : '') +
    ' ORDER BY id DESC';

  const registros = db.prepare(sql).all(...params);
  res.json({ registros });
});

/**
 * GET /api/registros/favoritos
 * Apenas os registros marcados como favoritos (tela Favoritos).
 */
router.get('/registros/favoritos', (req, res) => {
  const registros = db
    .prepare('SELECT * FROM registros WHERE favorito = 1 AND op_id IS NULL ORDER BY id DESC')
    .all();
  res.json({ registros });
});

/**
 * PATCH /api/registros/:id/favorito
 * Marca ou desmarca um registro como favorito (estrela).
 */
router.patch('/registros/:id/favorito', (req, res) => {
  const { id } = req.params;
  const registro = db.prepare('SELECT * FROM registros WHERE id = ?').get(id);

  if (!registro) {
    return res.status(404).json({ erro: 'Registro não encontrado.' });
  }

  const novoValor = registro.favorito ? 0 : 1;
  db.prepare('UPDATE registros SET favorito = ? WHERE id = ?').run(novoValor, id);

  res.json({ id: Number(id), favorito: novoValor });
});

/**
 * PATCH /api/registros/:id
 * Edita um registro-filho da linha do tempo de uma OP. Só é permitido
 * enquanto o registro estiver "Em andamento" (uma vez concluído, vira
 * histórico e não deve mais ser alterado).
 */
router.patch('/registros/:id', (req, res) => {
  const { id } = req.params;
  const existente = db.prepare('SELECT * FROM registros WHERE id = ?').get(id);

  if (!existente) {
    return res.status(404).json({ erro: 'Registro não encontrado.' });
  }
  if (existente.op_id !== null && existente.status !== 'Em andamento') {
    return res.status(400).json({
      erro: 'Só é possível editar registros que estejam "Em andamento".',
    });
  }

  const { tipo, titulo, descricao, status, responsavel, produto, processo, data } = req.body;

  db.prepare(
    `UPDATE registros
     SET tipo = ?, titulo = ?, descricao = ?, status = ?, responsavel = ?, produto = ?, processo = ?, data = ?
     WHERE id = ?`
  ).run(
    tipo ?? existente.tipo,
    titulo ?? existente.titulo,
    descricao ?? existente.descricao,
    status ?? existente.status,
    responsavel ?? existente.responsavel,
    produto ?? existente.produto,
    processo ?? existente.processo,
    data ?? existente.data,
    id
  );

  res.json({ sucesso: true });
});

router.post('/registros', (req, res) => {
  const { tipo, titulo, descricao, status, codigo, responsavel, produto, processo, opId, data } = req.body;

  if (!titulo) {
    return res.status(400).json({ erro: 'O título/nome é obrigatório.' });
  }

  try {
    const codigoGerado = codigo || `REG-${Date.now().toString().slice(-6)}`;
    const statusInicial = status || 'Em andamento';
    const dataAtual = data || new Date().toISOString().split('T')[0];

    const stmt = db.prepare(
      `INSERT INTO registros (codigo, tipo, titulo, descricao, status, data, responsavel, produto, processo, op_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const resultado = stmt.run(
      codigoGerado,
      tipo || 'op',
      titulo,
      descricao || '',
      statusInicial,
      dataAtual,
      responsavel || null,
      produto || null,
      processo || null,
      opId || null
    );

    res.status(201).json({ id: resultado.lastInsertRowid, sucesso: true });
  } catch (error) {
    console.log('Erro ao inserir registro:', error);
    res.status(500).json({ erro: 'Erro interno ao salvar o registro.' });
  }
});

/**
 * GET /api/registros/:id
 * Busca um registro específico (cabeçalho da tela de detalhe da OP).
 */
router.get('/registros/:id', (req, res) => {
  const registro = db.prepare('SELECT * FROM registros WHERE id = ?').get(req.params.id);
  if (!registro) {
    return res.status(404).json({ erro: 'Registro não encontrado.' });
  }
  res.json({ registro });
});

/**
 * GET /api/registros/:id/timeline
 * Lista os registros-filho de uma OP (recebimento, ocorrência, retrabalho, etc.).
 */
router.get('/registros/:id/timeline', (req, res) => {
  const timeline = db
    .prepare('SELECT * FROM registros WHERE op_id = ? ORDER BY id')
    .all(req.params.id);
  res.json({ timeline });
});

/**
 * GET /api/usuarios
 * Lista usuários ativos, usado no dropdown de "Responsável".
 */
router.get('/usuarios', (req, res) => {
  const usuarios = db
    .prepare("SELECT id, nome, cargo FROM usuarios WHERE status = 'Ativo' ORDER BY nome")
    .all();
  res.json({ usuarios });
});

/**
 * POST /api/registros/:id/anexos
 * Recebe um arquivo (foto/documento) e associa ao registro.
 */
router.post('/registros/:id/anexos', (req, res) => {
  upload.single('arquivo')(req, res, (erroUpload) => {
    if (erroUpload) {
      return res.status(400).json({ erro: erroUpload.message });
    }
    if (!req.file) {
      return res.status(400).json({ erro: 'Nenhum arquivo enviado.' });
    }

    const { id } = req.params;
    const registro = db.prepare('SELECT id FROM registros WHERE id = ?').get(id);
    if (!registro) {
      return res.status(404).json({ erro: 'Registro não encontrado.' });
    }

    const info = db
      .prepare('INSERT INTO anexos (registro_id, nome_arquivo, caminho) VALUES (?, ?, ?)')
      .run(id, req.file.originalname, req.file.filename);

    res.status(201).json({
      id: info.lastInsertRowid,
      nome_arquivo: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
    });
  });
});

/**
 * GET /api/registros/:id/anexos
 * Lista os anexos (fotos/documentos) de um registro.
 */
router.get('/registros/:id/anexos', (req, res) => {
  const anexos = db
    .prepare('SELECT * FROM anexos WHERE registro_id = ? ORDER BY id')
    .all(req.params.id);

  res.json({
    anexos: anexos.map((a) => ({ ...a, url: `/uploads/${a.caminho}` })),
  });
});

module.exports = router;
