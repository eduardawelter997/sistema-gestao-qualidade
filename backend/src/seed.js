/**
 * Popula o banco com dados de exemplo para demonstração.
 * Rode com:  npm run seed
 *
 * Cria um usuário de teste e vários registros da qualidade.
 */
const bcrypt = require('bcryptjs');
const { db, init } = require('./db');

init();

// Limpa dados antigos para não duplicar ao rodar o seed de novo
db.exec('DELETE FROM usuarios; DELETE FROM registros;');

// ---- Usuário de demonstração ----
const senhaHash = bcrypt.hashSync('123456', 10);
db.prepare(
  `INSERT INTO usuarios (nome, email, senha_hash, cargo, setor, perfil, status)
   VALUES (?, ?, ?, ?, ?, ?, ?)`
).run(
  'Carlos Silva',
  'carlos@setti.com',
  senhaHash,
  'Gestor da Qualidade',
  'Qualidade',
  'Administrador',
  'Ativo'
);

// ---- Registros da qualidade ----
const registros = [
  ['op', 'OP-2026-00125', 'Cliente', 'Item MB-450', 'Concluído', '20/08/2026', 1],
  ['ocorrencia', 'OC-2026-00018', 'Não conformidade', 'Medida fora da especificação', 'Aberta', '18/08/2026', 1],
  ['acao', 'AC-2026-00007', 'Ação Corretiva', 'Origem: Auditoria interna', 'Aberta', '15/08/2026', 0],
  ['recebimento', 'REC-2026-00015', 'Fornecedor Alfa', 'Material: Aço SAE 1045', 'Concluído', '14/08/2026', 0],
  ['op', 'OP-2026-00124', 'Cliente', 'Item XT-12', 'Atrasada', '12/08/2026', 0],
  ['op', 'OP-2026-00123', 'Cliente', 'Item RP-08', 'Em andamento', '10/08/2026', 0],
  ['op', 'OP-2026-00122', 'Cliente', 'Item MB-450', 'Em andamento', '08/08/2026', 0],
  ['op', 'OP-2026-00121', 'Cliente', 'Item KLA-3', 'Em andamento', '06/08/2026', 0],
  ['ocorrencia', 'OC-2026-00017', 'Não conformidade', 'Acabamento irregular', 'Aguardando avaliação', '05/08/2026', 0],
  ['ocorrencia', 'OC-2026-00016', 'Não conformidade', 'Rótulo incorreto', 'Aguardando avaliação', '04/08/2026', 0],
  ['acao', 'AC-2026-00006', 'Ação Corretiva', 'Origem: Reclamação de cliente', 'Atrasada', '02/08/2026', 0],
  ['ocorrencia', 'OC-2026-00015', 'Não conformidade', 'Dimensional fora do padrão', 'Aguardando avaliação', '01/08/2026', 0],
];

const insert = db.prepare(
  `INSERT INTO registros (tipo, codigo, titulo, descricao, status, data, favorito)
   VALUES (?, ?, ?, ?, ?, ?, ?)`
);

for (const r of registros) insert.run(...r);

console.log('Banco populado com sucesso!');
console.log('Usuário de teste -> e-mail: carlos@setti.com | senha: 123456');
