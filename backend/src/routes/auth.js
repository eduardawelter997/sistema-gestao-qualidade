/**
 * Rotas de autenticação: cadastro, login e dados do usuário logado.
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { db } = require('../db');
const { SECRET, TOKEN_EXPIRA_EM } = require('../config');
const { autenticar } = require('../auth-middleware');

const router = express.Router();

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

module.exports = router;
