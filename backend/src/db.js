/**
 * Conexão com o banco de dados SQLite e criação das tabelas.
 * O banco é um único arquivo (database.sqlite) criado na pasta backend/.
 */
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new Database(dbPath);

// Melhora a performance e a concorrência de escrita
db.pragma('journal_mode = WAL');

/**
 * Cria as tabelas caso ainda não existam.
 */
function init() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      senha_hash TEXT NOT NULL,
      cargo TEXT DEFAULT 'Colaborador',
      setor TEXT DEFAULT 'Qualidade',
      perfil TEXT DEFAULT 'Colaborador',
      status TEXT DEFAULT 'Ativo',
      criado_em TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS registros (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT NOT NULL,          -- op | ocorrencia | acao | recebimento | ...
      codigo TEXT NOT NULL,        -- ex: OP-2026-00125
      titulo TEXT NOT NULL,        -- ex: "Cliente", "Fornecedor Alfa"
      descricao TEXT,              -- item/descrição resumida
      status TEXT NOT NULL,        -- Em andamento | Aberta | Concluído | Atrasada | ...
      data TEXT NOT NULL,          -- data do registro (texto)
      favorito INTEGER DEFAULT 0,  -- 0 = não, 1 = sim
      criado_por INTEGER,
      criado_em TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS anexos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      registro_id INTEGER NOT NULL,
      nome_arquivo TEXT NOT NULL,
      caminho TEXT NOT NULL,
      criado_em TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (registro_id) REFERENCES registros(id)
    );
  `);

  // Colunas adicionadas depois da criação inicial da tabela (bancos já
  // existentes não ganham colunas novas via CREATE TABLE IF NOT EXISTS).
  const colunasNovas = [
    'ALTER TABLE registros ADD COLUMN op_id INTEGER',
    'ALTER TABLE registros ADD COLUMN responsavel TEXT',
    'ALTER TABLE registros ADD COLUMN produto TEXT',
    'ALTER TABLE registros ADD COLUMN processo TEXT',
    // Não conformidade (Produto Não Conforme)
    'ALTER TABLE registros ADD COLUMN lote TEXT',
    'ALTER TABLE registros ADD COLUMN quantidade TEXT',
    'ALTER TABLE registros ADD COLUMN disposicao TEXT',
    // Ação corretiva
    'ALTER TABLE registros ADD COLUMN origem TEXT',
    'ALTER TABLE registros ADD COLUMN metodo_analise TEXT',
    'ALTER TABLE registros ADD COLUMN analise_causa TEXT',
    // Vínculos opcionais entre registros (guardam o id, não texto solto)
    'ALTER TABLE registros ADD COLUMN op_relacionada_id INTEGER',
    'ALTER TABLE registros ADD COLUMN ocorrencia_relacionada_id INTEGER',
    'ALTER TABLE registros ADD COLUMN cliente_fornecedor_id INTEGER',
    // Recebimento
    'ALTER TABLE registros ADD COLUMN nota_fiscal TEXT',
    'ALTER TABLE registros ADD COLUMN com_problema INTEGER DEFAULT 0',
  ];
  for (const sql of colunasNovas) {
    try {
      db.exec(sql);
    } catch (e) {
      // Coluna já existe — ignora.
    }
  }
}

module.exports = { db, init };
