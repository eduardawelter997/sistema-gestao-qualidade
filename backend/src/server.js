/**
 * Ponto de entrada da API.
 * Sobe um servidor Express que expõe as rotas em /api/...
 */
const express = require('express');
const cors = require('cors');

const { init } = require('./db');
const { uploadsDir } = require('./upload');
const { PORT } = require('./config');
const authRoutes = require('./routes/auth');
const registrosRoutes = require('./routes/registros');

// Garante que as tabelas existam
init();

const app = express();
app.use(cors());            // libera o acesso a partir do app mobile
app.use(express.json());    // entende corpo de requisição em JSON
app.use('/uploads', express.static(uploadsDir)); // fotos/documentos anexados

// Rota simples para testar se a API está no ar
app.get('/', (req, res) => {
  res.json({ ok: true, api: 'Sistema de Gestão da Qualidade' });
});

app.use('/api/auth', authRoutes);
app.use('/api', registrosRoutes);

// Escuta em 0.0.0.0 para aceitar conexões do emulador e do celular na rede local
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API rodando em http://0.0.0.0:${PORT}`);
});
