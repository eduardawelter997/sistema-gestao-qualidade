/**
 * Rotas dos registros da qualidade (OPs, ocorrências, ações, recebimentos)
 * e do dashboard. Alimentam as telas Início, Busca e Favoritos.
 */
const express = require('express');
const { db } = require('../db');
const { autenticar } = require('../auth-middleware');

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
    .prepare('SELECT * FROM registros ORDER BY id DESC LIMIT 5')
    .all();

  res.json({ overview, recentes });
});

/**
 * GET /api/registros?tipo=op&q=texto
 * Lista registros com filtro opcional por tipo e por busca textual (tela Busca).
 */
router.get('/registros', (req, res) => {
  const { tipo, q } = req.query;
  const where = [];
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
    .prepare('SELECT * FROM registros WHERE favorito = 1 ORDER BY id DESC')
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

router.post('/registros', (req, res) => {
  const { tipo, titulo, descricao, status } = req.body;

  if (!titulo) {
    return res.status(400).json({ erro: 'O título/nome é obrigatório.' });
  }

  try {
    const codigoGerado = `REG-${Date.now().toString().slice(-6)}`;
    const statusInicial = status || 'Em andamento';
    const dataAtual = new Date().toISOString().split('T')[0]; // Data atual no formato YYYY-MM-DD

    const stmt = db.prepare(
      'INSERT INTO registros (codigo, tipo, titulo, descricao, status, data) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const resultado = stmt.run(
      codigoGerado, 
      tipo || 'op', 
      titulo, 
      descricao || '', 
      statusInicial, 
      dataAtual
    );

    res.status(201).json({ id: resultado.lastInsertRowid, sucesso: true });
  } catch (error) {
    console.log('Erro ao inserir registro:', error);
    res.status(500).json({ erro: 'Erro interno ao salvar o registro.' });
  }
});

module.exports = router;
