/**
 * Rotas dos registros da qualidade (OPs, ocorrências, ações, recebimentos)
 * e do dashboard. Alimentam as telas Início, Busca e Favoritos.
 */
const fs = require('fs');
const path = require('path');
const express = require('express');
const { db } = require('../db');
const { autenticar } = require('../auth-middleware');
const { upload, uploadsDir } = require('../upload');
const {
  exigirPermissao,
  usuarioTemPermissao,
} = require('../permissao-middleware');

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

  // Clientes/fornecedores são cadastro, não eventos da qualidade — não
  // entram nos registros recentes da tela Início.
  const recentes = db
    .prepare(
      "SELECT * FROM registros WHERE op_id IS NULL AND tipo NOT IN ('cliente', 'fornecedor') ORDER BY id DESC LIMIT 5"
    )
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
  } else {
    // "Todos" na Busca são os registros da qualidade — clientes/fornecedores
    // são cadastro, não aparecem misturados na busca geral.
    where.push("tipo NOT IN ('cliente', 'fornecedor')");
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
    .prepare(
      "SELECT * FROM registros WHERE favorito = 1 AND op_id IS NULL AND tipo NOT IN ('cliente', 'fornecedor') ORDER BY id DESC"
    )
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
 * Edita um registro existente (Ação Corretiva, ou um registro-filho da
 * linha do tempo de uma OP). Registros-filho só podem ser editados
 * enquanto estiverem "Em andamento" (uma vez concluídos, viram histórico);
 * essa restrição não se aplica a registros de topo (op_id nulo).
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

  const {
    tipo, titulo, descricao, status, responsavel, produto, processo, data,
    lote, quantidade, disposicao, origem, metodoAnalise, analiseCausa,
    opRelacionadaId, ocorrenciaRelacionadaId, clienteFornecedorId,
    notaFiscal, comProblema, avaliacaoEficacia,
  } = req.body;

  const tipoFinal = tipo ?? existente.tipo;

    if (
      analiseCausa !== undefined &&
      analiseCausa !== existente.analise_causa &&
      !usuarioTemPermissao(req.usuario.id, 'definir_causa_raiz')
    ) {
      return res.status(403).json({
        erro: 'Você não possui permissão para definir a causa raiz.',
      });
    }

    if (
      tipoFinal === 'acao' &&
      status === 'Concluído' &&
      existente.status !== 'Concluído' &&
      !usuarioTemPermissao(req.usuario.id, 'encerrar_acoes')
    ) {
      return res.status(403).json({
        erro: 'Você não possui permissão para encerrar ações corretivas.',
      });
    }

    if (
      avaliacaoEficacia !== undefined &&
      avaliacaoEficacia !== existente.avaliacao_eficacia &&
      !usuarioTemPermissao(req.usuario.id, 'avaliar_eficacia')
    ) {
      return res.status(403).json({
        erro: 'Você não possui permissão para avaliar a eficácia.',
      });
    }
    if (
      tipoFinal === 'recebimento' &&
      comProblema !== undefined &&
      Boolean(comProblema) !== Boolean(existente.com_problema) &&
      !usuarioTemPermissao(req.usuario.id, 'registrar_problemas')
    ) {
      return res.status(403).json({
        erro: 'Você não possui permissão para registrar problemas no recebimento.',
      });
    }

  const statusFinal = status ?? existente.status;
  // Marca a data de conclusão na primeira vez que o status vira "Concluído"
  // (usado pra calcular o tempo médio de resolução nos indicadores).
  const concluidoEm =
    statusFinal === 'Concluído' && existente.status !== 'Concluído'
      ? new Date().toISOString().slice(0, 19).replace('T', ' ')
      : existente.concluido_em;

  db.prepare(
    `UPDATE registros SET
      tipo = ?, titulo = ?, descricao = ?, status = ?, responsavel = ?, produto = ?, processo = ?, data = ?,
      lote = ?, quantidade = ?, disposicao = ?, origem = ?, metodo_analise = ?, analise_causa = ?,
      op_relacionada_id = ?, ocorrencia_relacionada_id = ?, cliente_fornecedor_id = ?,
      nota_fiscal = ?, com_problema = ?, avaliacao_eficacia = ?, concluido_em = ?
     WHERE id = ?`
  ).run(
    tipo ?? existente.tipo,
    titulo ?? existente.titulo,
    descricao ?? existente.descricao,
    statusFinal,
    responsavel ?? existente.responsavel,
    produto ?? existente.produto,
    processo ?? existente.processo,
    data ?? existente.data,
    lote ?? existente.lote,
    quantidade ?? existente.quantidade,
    disposicao ?? existente.disposicao,
    origem ?? existente.origem,
    metodoAnalise ?? existente.metodo_analise,
    analiseCausa ?? existente.analise_causa,
    opRelacionadaId !== undefined ? opRelacionadaId : existente.op_relacionada_id,
    ocorrenciaRelacionadaId !== undefined ? ocorrenciaRelacionadaId : existente.ocorrencia_relacionada_id,
    clienteFornecedorId !== undefined ? clienteFornecedorId : existente.cliente_fornecedor_id,
    notaFiscal ?? existente.nota_fiscal,
    comProblema !== undefined ? (comProblema ? 1 : 0) : existente.com_problema,
    avaliacaoEficacia !== undefined
      ? avaliacaoEficacia
      : existente.avaliacao_eficacia,
    concluidoEm,
    id
  );

  res.json({ sucesso: true });
});

const PREFIXOS_CODIGO = { op: 'OP', ocorrencia: 'OC', acao: 'AC', recebimento: 'REC' };

router.post('/registros', (req, res) => {
  const {
    tipo, titulo, descricao, status, codigo, responsavel, produto, processo, opId, data,
    lote, quantidade, disposicao, origem, metodoAnalise, analiseCausa,
    opRelacionadaId, ocorrenciaRelacionadaId, clienteFornecedorId,
    notaFiscal, comProblema,
  } = req.body;

  

  if (!titulo) {
    return res.status(400).json({ erro: 'O título/nome é obrigatório.' });
  }

  try {
    const tipoFinal = tipo || 'op';
    if (
      (tipoFinal === 'cliente' || tipoFinal === 'fornecedor') &&
      !usuarioTemPermissao(req.usuario.id, 'cadastrar_clientes')
    ) {
      return res.status(403).json({
        erro: 'Você não possui permissão para cadastrar clientes ou fornecedores.',
      });
    }
    if (
      tipoFinal === 'recebimento' &&
      !usuarioTemPermissao(req.usuario.id, 'registrar_recebimentos')
    ) {
      return res.status(403).json({
        erro: 'Você não possui permissão para registrar recebimentos.',
      });
    }
    if (
      tipoFinal === 'recebimento' &&
      comProblema === true &&
      !usuarioTemPermissao(req.usuario.id, 'registrar_problemas')
    ) {
      return res.status(403).json({
        erro: 'Você não possui permissão para registrar problemas no recebimento.',
      });
    }
    if (
      tipoFinal === 'acao' &&
      analiseCausa &&
      !usuarioTemPermissao(req.usuario.id, 'definir_causa_raiz')
    ) {
      return res.status(403).json({
        erro: 'Você não possui permissão para definir a causa raiz.',
      });
    }
    const prefixo = PREFIXOS_CODIGO[tipoFinal] || 'REG';
    const codigoGerado =
      codigo || `${prefixo}-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    const statusInicial = status || 'Em andamento';
    const dataAtual = data || new Date().toISOString().split('T')[0];

    const stmt = db.prepare(
      `INSERT INTO registros (
        codigo, tipo, titulo, descricao, status, data, responsavel, produto, processo, op_id,
        lote, quantidade, disposicao, origem, metodo_analise, analise_causa,
        op_relacionada_id, ocorrencia_relacionada_id, cliente_fornecedor_id,
        nota_fiscal, com_problema
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const resultado = stmt.run(
      codigoGerado,
      tipoFinal,
      titulo,
      descricao || '',
      statusInicial,
      dataAtual,
      responsavel || null,
      produto || null,
      processo || null,
      opId || null,
      lote || null,
      quantidade || null,
      disposicao || null,
      origem || null,
      metodoAnalise || null,
      analiseCausa || null,
      opRelacionadaId || null,
      ocorrenciaRelacionadaId || null,
      clienteFornecedorId || null,
      notaFiscal || null,
      comProblema ? 1 : 0
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
router.post('/registros/:id/anexos', exigirPermissao('adicionar_fotos'), (req, res) => {
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
      .prepare(
        `INSERT INTO anexos (registro_id, nome_arquivo, caminho, tamanho, tipo_mime)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(id, req.file.originalname, req.file.filename, req.file.size, req.file.mimetype);

    res.status(201).json({
      id: info.lastInsertRowid,
      nome_arquivo: req.file.originalname,
      tamanho: req.file.size,
      tipo_mime: req.file.mimetype,
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

/**
 * DELETE /api/anexos/:id
 * Remove um anexo (registro no banco + arquivo em disco).
 */
router.delete('/anexos/:id', exigirPermissao('adicionar_fotos'), (req, res) => {
  const anexo = db.prepare('SELECT * FROM anexos WHERE id = ?').get(req.params.id);
  if (!anexo) {
    return res.status(404).json({ erro: 'Anexo não encontrado.' });
  }

  db.prepare('DELETE FROM anexos WHERE id = ?').run(req.params.id);

  fs.unlink(path.join(uploadsDir, anexo.caminho), () => {
    // Ignora erro caso o arquivo já não exista em disco.
  });

  res.json({ sucesso: true });
});

module.exports = router;
