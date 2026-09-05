/**
 * Popula o banco com dados de exemplo para demonstração.
 * Rode com:  npm run seed
 *
 * Cria os usuários de teste e um conjunto amplo de registros da qualidade
 * (clientes/fornecedores, OPs, ocorrências, ações corretivas e
 * recebimentos), todos interligados, para uma demonstração completa do app.
 */
const bcrypt = require('bcryptjs');
const { db, init } = require('./db');

init();

// Limpa dados antigos para não duplicar ao rodar o seed de novo
db.exec('DELETE FROM usuarios; DELETE FROM registros; DELETE FROM anexos;');

function inserirUsuario({ nome, email, senha, cargo, setor, perfil, status }) {
  const senha_hash = bcrypt.hashSync(senha, 10);
  db.prepare(
    `INSERT INTO usuarios (nome, email, senha_hash, cargo, setor, perfil, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(nome, email, senha_hash, cargo, setor, perfil, status);
}

function inserirRegistro({
  tipo, codigo, titulo, descricao = '', status, data, favorito = 0,
  responsavel = null, produto = null, processo = null,
  lote = null, quantidade = null, disposicao = null,
  origem = null, metodoAnalise = null, analiseCausa = null,
  opRelacionadaId = null, ocorrenciaRelacionadaId = null, clienteFornecedorId = null,
  notaFiscal = null, comProblema = 0, avaliacaoEficacia = null,
  criadoEm, concluidoEm = null,
}) {
  const info = db.prepare(`
    INSERT INTO registros (
      tipo, codigo, titulo, descricao, status, data, favorito,
      responsavel, produto, processo, lote, quantidade, disposicao,
      origem, metodo_analise, analise_causa,
      op_relacionada_id, ocorrencia_relacionada_id, cliente_fornecedor_id,
      nota_fiscal, com_problema, avaliacao_eficacia,
      criado_em, concluido_em
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    tipo, codigo, titulo, descricao, status, data, favorito,
    responsavel, produto, processo, lote, quantidade, disposicao,
    origem, metodoAnalise, analiseCausa,
    opRelacionadaId, ocorrenciaRelacionadaId, clienteFornecedorId,
    notaFiscal, comProblema ? 1 : 0, avaliacaoEficacia,
    criadoEm, concluidoEm
  );
  return info.lastInsertRowid;
}

// ---- Usuários ----
inserirUsuario({
  nome: 'Anselmo Setti',
  email: 'anselmosetti@gmail.com',
  senha: '123456',
  cargo: 'Gestor da Qualidade',
  setor: 'Qualidade',
  perfil: 'Administrador',
  status: 'Ativo',
});
inserirUsuario({
  nome: 'Carlos Silva',
  email: 'carlos@setti.com',
  senha: '123456',
  cargo: 'Gestor da Qualidade',
  setor: 'Qualidade',
  perfil: 'Gestor da Qualidade',
  status: 'Ativo',
});
inserirUsuario({
  nome: 'Mariana Souza',
  email: 'mariana.souza@setti.com',
  senha: '123456',
  cargo: 'Almoxarife',
  setor: 'Almoxarifado',
  perfil: 'Almoxarife',
  status: 'Ativo',
});
inserirUsuario({
  nome: 'João Oliveira',
  email: 'joao.oliveira@setti.com',
  senha: '123456',
  cargo: 'Gestor',
  setor: 'Produção',
  perfil: 'Gestor',
  status: 'Ativo',
});
// Acesso ainda não ativado: cadastrado pelo gestor, aguardando "Primeiro acesso".
inserirUsuario({
  nome: 'Fernanda Lima',
  email: 'fernanda.lima@setti.com',
  senha: 'inicial123',
  cargo: 'Colaborador',
  setor: 'Qualidade',
  perfil: 'Colaborador',
  status: 'Pendente',
});

// ---- Clientes e fornecedores ----
const clienteHorizonte = inserirRegistro({
  tipo: 'cliente', codigo: 'CLI-001', titulo: 'Metalúrgica Horizonte',
  status: 'Ativo', data: '01/08/2026', criadoEm: '2026-08-01 08:00:00',
});
const clienteValeDoAco = inserirRegistro({
  tipo: 'cliente', codigo: 'CLI-002', titulo: 'Indústria Vale do Aço',
  status: 'Ativo', data: '01/08/2026', criadoEm: '2026-08-01 08:05:00',
});
const clienteSantaRita = inserirRegistro({
  tipo: 'cliente', codigo: 'CLI-003', titulo: 'Usinagem Santa Rita',
  status: 'Ativo', data: '01/08/2026', criadoEm: '2026-08-01 08:10:00',
});
const fornecedorAcosMinas = inserirRegistro({
  tipo: 'fornecedor', codigo: 'FOR-001', titulo: 'Aços Minas Ltda',
  status: 'Ativo', data: '01/08/2026', criadoEm: '2026-08-01 08:15:00',
});
const fornecedorFerramentasSul = inserirRegistro({
  tipo: 'fornecedor', codigo: 'FOR-002', titulo: 'Ferramentas Sul Ltda',
  status: 'Ativo', data: '01/08/2026', criadoEm: '2026-08-01 08:20:00',
});
const fornecedorSuprimentosVale = inserirRegistro({
  tipo: 'fornecedor', codigo: 'FOR-003', titulo: 'Suprimentos Industriais Vale',
  status: 'Ativo', data: '01/08/2026', criadoEm: '2026-08-01 08:25:00',
});

// ---- Ordens de Produção ----
const op121 = inserirRegistro({
  tipo: 'op', codigo: 'OP-2026-00121', titulo: 'Cliente', descricao: 'Item KLA-3',
  status: 'Em andamento', data: '06/08/2026', responsavel: 'João Oliveira',
  produto: 'Item KLA-3', processo: 'Produção', clienteFornecedorId: clienteValeDoAco,
  criadoEm: '2026-08-06 09:00:00',
});
const op122 = inserirRegistro({
  tipo: 'op', codigo: 'OP-2026-00122', titulo: 'Cliente', descricao: 'Item MB-450',
  status: 'Em andamento', data: '08/08/2026', responsavel: 'Carlos Silva',
  produto: 'Item MB-450', processo: 'Acabamento', clienteFornecedorId: clienteHorizonte,
  criadoEm: '2026-08-08 09:00:00',
});
const op123 = inserirRegistro({
  tipo: 'op', codigo: 'OP-2026-00123', titulo: 'Cliente', descricao: 'Item RP-08',
  status: 'Em andamento', data: '10/08/2026', responsavel: 'Mariana Souza',
  produto: 'Item RP-08', processo: 'Produção', clienteFornecedorId: clienteSantaRita,
  criadoEm: '2026-08-10 09:00:00',
});
const op124 = inserirRegistro({
  tipo: 'op', codigo: 'OP-2026-00124', titulo: 'Cliente', descricao: 'Item XT-12',
  status: 'Atrasada', data: '12/08/2026', responsavel: 'João Oliveira',
  produto: 'Item XT-12', processo: 'Corte', clienteFornecedorId: clienteValeDoAco,
  criadoEm: '2026-08-12 09:00:00',
});
const op125 = inserirRegistro({
  tipo: 'op', codigo: 'OP-2026-00125', titulo: 'Cliente', descricao: 'Item MB-450',
  status: 'Concluído', data: '20/08/2026', responsavel: 'Carlos Silva',
  produto: 'Item MB-450', processo: 'Laminação', clienteFornecedorId: clienteHorizonte,
  criadoEm: '2026-08-15 09:00:00', concluidoEm: '2026-08-20 17:00:00',
});
const op126 = inserirRegistro({
  tipo: 'op', codigo: 'OP-2026-00126', titulo: 'Cliente', descricao: 'Item NF-22',
  status: 'Concluído', data: '22/08/2026', responsavel: 'Carlos Silva',
  produto: 'Item NF-22', processo: 'Qualidade', clienteFornecedorId: clienteSantaRita,
  criadoEm: '2026-08-17 09:00:00', concluidoEm: '2026-08-22 17:00:00',
});
const op127 = inserirRegistro({
  tipo: 'op', codigo: 'OP-2026-00127', titulo: 'Cliente', descricao: 'Item ZT-9',
  status: 'Em andamento', data: '24/08/2026', responsavel: 'Mariana Souza',
  produto: 'Item ZT-9', processo: 'Corte', clienteFornecedorId: clienteHorizonte,
  criadoEm: '2026-08-24 09:00:00',
});

// ---- Ocorrências ----
const oc015 = inserirRegistro({
  tipo: 'ocorrencia', codigo: 'OC-2026-00015', titulo: 'Não conformidade',
  descricao: 'Dimensional fora do padrão identificado na inspeção de recebimento.',
  status: 'Aguardando avaliação', data: '01/08/2026', processo: 'Corte',
  responsavel: 'Carlos Silva', opRelacionadaId: op124, clienteFornecedorId: clienteValeDoAco,
  disposicao: 'Refugo', criadoEm: '2026-08-13 10:00:00',
});
const oc016 = inserirRegistro({
  tipo: 'ocorrencia', codigo: 'OC-2026-00016', titulo: 'Não conformidade',
  descricao: 'Rótulo incorreto identificado na expedição.',
  status: 'Aguardando avaliação', data: '04/08/2026', processo: 'Qualidade',
  responsavel: 'Mariana Souza', opRelacionadaId: op123, clienteFornecedorId: clienteSantaRita,
  disposicao: 'Retrabalho', criadoEm: '2026-08-11 10:00:00',
});
const oc017 = inserirRegistro({
  tipo: 'ocorrencia', codigo: 'OC-2026-00017', titulo: 'Não conformidade',
  descricao: 'Acabamento irregular identificado durante inspeção final.',
  status: 'Aguardando avaliação', data: '05/08/2026', processo: 'Acabamento',
  responsavel: 'João Oliveira', opRelacionadaId: op122, clienteFornecedorId: clienteHorizonte,
  disposicao: 'Reparo', criadoEm: '2026-08-09 10:00:00',
});
const oc018 = inserirRegistro({
  tipo: 'ocorrencia', codigo: 'OC-2026-00018', titulo: 'Não conformidade',
  descricao:
    'Durante a inspeção final, foi identificada uma medida fora da especificação dimensional da peça, sendo necessário realizar retrabalho antes da liberação.',
  status: 'Aberta', data: '18/08/2026', processo: 'Laminação',
  responsavel: 'Carlos Silva', opRelacionadaId: op125, clienteFornecedorId: clienteHorizonte,
  disposicao: 'Retrabalho', produto: 'Item MB-450', lote: 'L-2026-0456', quantidade: '120 un',
  favorito: 1, criadoEm: '2026-08-18 10:00:00',
});
const oc019 = inserirRegistro({
  tipo: 'ocorrencia', codigo: 'OC-2026-00019', titulo: 'Erro de processo',
  descricao: 'Parâmetro de solda fora do padrão identificado durante auditoria interna.',
  status: 'Concluído', data: '21/08/2026', processo: 'Produção',
  responsavel: 'João Oliveira', opRelacionadaId: op126, clienteFornecedorId: clienteSantaRita,
  criadoEm: '2026-08-21 08:30:00', concluidoEm: '2026-08-24 17:00:00',
});
const oc020 = inserirRegistro({
  tipo: 'ocorrencia', codigo: 'OC-2026-00020', titulo: 'Problema no recebimento',
  descricao: 'Divergência de quantidade recebida em relação à nota fiscal.',
  status: 'Concluído', data: '15/08/2026', processo: 'Almoxarifado',
  responsavel: 'Mariana Souza', clienteFornecedorId: fornecedorAcosMinas,
  criadoEm: '2026-08-15 10:00:00', concluidoEm: '2026-08-17 15:00:00',
});

// ---- Ações corretivas ----
inserirRegistro({
  tipo: 'acao', codigo: 'AC-2026-00006', titulo: 'Ação Corretiva',
  descricao: 'Padronizar parâmetro de acabamento e treinar equipe.',
  status: 'Atrasada', data: '02/08/2026', origem: 'Reclamação de cliente',
  responsavel: 'João Oliveira', processo: 'Acabamento', ocorrenciaRelacionadaId: oc017,
  metodoAnalise: 'Ishikawa', analiseCausa: 'Parâmetro de lixamento não padronizado entre turnos.',
  avaliacaoEficacia: 'Não eficaz', criadoEm: '2026-08-10 09:00:00',
});
inserirRegistro({
  tipo: 'acao', codigo: 'AC-2026-00007', titulo: 'Ação Corretiva',
  descricao: 'Reafiar/trocar ferramenta e revisar checklist de setup.',
  status: 'Aberta', data: '19/08/2026', origem: 'Ocorrência',
  responsavel: 'Carlos Silva', processo: 'Laminação', ocorrenciaRelacionadaId: oc018,
  metodoAnalise: '5 Porquês', analiseCausa: 'Desgaste da ferramenta de corte não identificado no setup.',
  avaliacaoEficacia: 'Aguardando avaliação', criadoEm: '2026-08-19 09:00:00',
});
inserirRegistro({
  tipo: 'acao', codigo: 'AC-2026-00008', titulo: 'Ação Corretiva',
  descricao: 'Atualizar procedimento de solda e retrabalhar operadores.',
  status: 'Concluído', data: '22/08/2026', origem: 'Ocorrência',
  responsavel: 'João Oliveira', processo: 'Produção', ocorrenciaRelacionadaId: oc019,
  metodoAnalise: '5 Porquês', analiseCausa: 'Parâmetro de solda desatualizado no procedimento.',
  avaliacaoEficacia: 'Eficaz', criadoEm: '2026-08-22 09:00:00', concluidoEm: '2026-08-25 16:00:00',
});
inserirRegistro({
  tipo: 'acao', codigo: 'AC-2026-00009', titulo: 'Ação Corretiva',
  descricao: 'Implementar conferência 100% para lotes acima de determinado valor.',
  status: 'Concluído', data: '16/08/2026', origem: 'Auditoria',
  responsavel: 'Mariana Souza', processo: 'Almoxarifado', ocorrenciaRelacionadaId: oc020,
  metodoAnalise: 'Ishikawa', analiseCausa: 'Conferência de recebimento feita por amostragem, não 100%.',
  avaliacaoEficacia: 'Eficaz', criadoEm: '2026-08-16 09:00:00', concluidoEm: '2026-08-18 14:00:00',
});

// ---- Recebimentos ----
inserirRegistro({
  tipo: 'recebimento', codigo: 'REC-2026-00013', titulo: 'Aços Minas Ltda',
  descricao: 'Recebimento conferido sem divergências.', produto: 'Aço SAE 1045',
  status: 'Concluído', data: '05/08/2026', responsavel: 'Mariana Souza',
  clienteFornecedorId: fornecedorAcosMinas, notaFiscal: 'NF-45210', comProblema: false,
  criadoEm: '2026-08-05 11:00:00',
});
inserirRegistro({
  tipo: 'recebimento', codigo: 'REC-2026-00014', titulo: 'Ferramentas Sul Ltda',
  descricao: 'Divergência de quantidade recebida em relação à nota fiscal.', produto: 'Insertos de metal duro',
  status: 'Aguardando avaliação', data: '10/08/2026', responsavel: 'Mariana Souza',
  clienteFornecedorId: fornecedorFerramentasSul, notaFiscal: 'NF-45298', comProblema: true,
  criadoEm: '2026-08-10 11:00:00',
});
inserirRegistro({
  tipo: 'recebimento', codigo: 'REC-2026-00015', titulo: 'Suprimentos Industriais Vale',
  descricao: 'Recebimento conferido sem divergências.', produto: 'Óleo de corte',
  status: 'Concluído', data: '14/08/2026', responsavel: 'Carlos Silva',
  clienteFornecedorId: fornecedorSuprimentosVale, notaFiscal: 'NF-45355', comProblema: false,
  criadoEm: '2026-08-14 11:00:00',
});
inserirRegistro({
  tipo: 'recebimento', codigo: 'REC-2026-00016', titulo: 'Aços Minas Ltda',
  descricao: 'Recebimento conferido sem divergências.', produto: 'Chapa de aço inox',
  status: 'Concluído', data: '19/08/2026', responsavel: 'Mariana Souza',
  clienteFornecedorId: fornecedorAcosMinas, notaFiscal: 'NF-45410', comProblema: false,
  favorito: 1, criadoEm: '2026-08-19 11:00:00',
});

console.log('Banco populado com sucesso!');
console.log('Usuário principal -> e-mail: anselmosetti@gmail.com | senha: 123456');
console.log('Colaborador pendente (teste de "Primeiro acesso") -> e-mail: fernanda.lima@setti.com | senha inicial: inicial123');
console.log('Código padrão de recuperação de senha: 123456');
