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

/**
 * POST /api/auth/cadastrar-funcionario
 * Permite que um gestor cadastre um novo funcionário informando cargo, setor e perfil.
 */
router.post('/cadastrar-funcionario', autenticar, (req, res) => {
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

  // Insere o funcionário preenchendo as colunas específicas da tabela usuarios
  const info = db
    .prepare(`
      INSERT INTO usuarios (nome, email, senha_hash, cargo, setor, perfil, status) 
      VALUES (?, ?, ?, ?, ?, ?, 'Ativo')
    `)
    .run(nome, email.toLowerCase(), senha_hash, perfil, setor, perfil);

  const usuarioCriado = db
    .prepare('SELECT * FROM usuarios WHERE id = ?')
    .get(info.lastInsertRowid);

  res.status(201).json({ 
    mensagem: 'Funcionário cadastrado com sucesso!', 
    usuario: limparUsuario(usuarioCriado) 
  });
});

/**
 * GET /api/auth/funcionarios
 * Retorna a lista de todos os usuários cadastrados para exibir na gestão.
 */
router.get('/funcionarios', autenticar, (req, res) => {
  const funcionarios = db
    .prepare('SELECT id, nome, email, cargo, setor, perfil, status, criado_em FROM usuarios')
    .all();

  res.json({ funcionarios });
});

router.patch('/desativar-funcionario/:id', autenticar, (req, res) => {
  try {
    const { id } = req.params;

    // Atualiza o status do funcionário no banco SQLite
    const info = db
      .prepare('UPDATE usuarios SET status = ? WHERE id = ?')
      .run('Inativo', id);

    if (info.changes === 0) {
      return res.status(404).json({ erro: 'Funcionário não encontrado.' });
    }

    return res.status(200).json({ mensagem: 'Funcionário desativado com sucesso!' });
  } catch (error) {
    console.log('Erro ao desativar funcionário:', error);
    return res.status(500).json({ erro: 'Erro interno ao desativar funcionário.' });
  }
});

router.patch('/ativar-funcionario/:id', autenticar, (req, res) => {
  try {
    const { id } = req.params;

    const info = db
      .prepare('UPDATE usuarios SET status = ? WHERE id = ?')
      .run('Ativo', id);

    if (info.changes === 0) {
      return res.status(404).json({ erro: 'Funcionário não encontrado.' });
    }

    return res.status(200).json({ mensagem: 'Funcionário ativado com sucesso!' });
  } catch (error) {
    console.log('Erro ao ativar funcionário:', error);
    return res.status(500).json({ erro: 'Erro interno ao ativar funcionário.' });
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
      return res.status(404).json({ erro: 'Funcionário não encontrado.' });
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

module.exports = router;
