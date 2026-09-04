/**
 * Tela "Produto Não Conforme" — registra um produto ou material fora de
 * especificação, opcionalmente vinculado a uma OP e a um cliente/fornecedor.
 * Ao salvar, cria uma ocorrência e abre a tela de detalhe dela.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

import { colors } from '../theme/colors';
import {
  criarRegistro,
  enviarAnexo,
  listarRegistros,
  listarUsuarios,
  listarClientesFornecedores,
  Registro,
  UsuarioResumo,
} from '../services/api';
import { alertar } from '../utils/alerta';

const SETORES_PROCESSOS = [
  { valor: 'Produção', rotulo: 'Produção - Setor' },
  { valor: 'Qualidade', rotulo: 'Qualidade - Setor' },
  { valor: 'Almoxarifado', rotulo: 'Almoxarifado - Setor' },
  { valor: 'Laminação', rotulo: 'Laminação - Processo' },
  { valor: 'Corte', rotulo: 'Corte - Processo' },
  { valor: 'Acabamento', rotulo: 'Acabamento - Processo' },
];

const DISPOSICOES = ['Retrabalho', 'Reparo', 'Refugo', 'Devolução', 'Liberação por concessão'];

function dataDeHoje() {
  const hoje = new Date();
  const dia = String(hoje.getDate()).padStart(2, '0');
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}/${hoje.getFullYear()}`;
}

function aplicarMascaraData(texto: string) {
  const apenasNumeros = texto.replace(/\D/g, '').slice(0, 8);
  if (apenasNumeros.length > 4) {
    return `${apenasNumeros.slice(0, 2)}/${apenasNumeros.slice(2, 4)}/${apenasNumeros.slice(4)}`;
  }
  if (apenasNumeros.length > 2) {
    return `${apenasNumeros.slice(0, 2)}/${apenasNumeros.slice(2)}`;
  }
  return apenasNumeros;
}

async function escolherFoto() {
  const resultado = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
  });
  if (resultado.canceled || !resultado.assets?.[0]) return null;
  const asset = resultado.assets[0];
  return {
    uri: asset.uri,
    name: asset.fileName || `foto-${Date.now()}.jpg`,
    type: asset.mimeType || 'image/jpeg',
  };
}

export default function NovoProdutoNaoConformeScreen() {
  const navigation = useNavigation<any>();

  const [produto, setProduto] = useState('');
  const [lote, setLote] = useState('');
  const [quantidade, setQuantidade] = useState('');

  const [ops, setOps] = useState<Registro[]>([]);
  const [opRelacionada, setOpRelacionada] = useState<{ id: number; codigo: string } | null>(null);
  const [mostrarOps, setMostrarOps] = useState(false);

  const [clientesFornecedores, setClientesFornecedores] = useState<Registro[]>([]);
  const [clienteFornecedor, setClienteFornecedor] = useState<{ id: number; label: string } | null>(null);
  const [mostrarClientesFornecedores, setMostrarClientesFornecedores] = useState(false);

  const [setorProcesso, setSetorProcesso] = useState('');
  const [mostrarSetores, setMostrarSetores] = useState(false);

  const [usuarios, setUsuarios] = useState<UsuarioResumo[]>([]);
  const [responsavel, setResponsavel] = useState('');
  const [mostrarResponsaveis, setMostrarResponsaveis] = useState(false);

  const [data, setData] = useState(dataDeHoje());
  const [descricao, setDescricao] = useState('');

  const [disposicao, setDisposicao] = useState('');
  const [mostrarDisposicoes, setMostrarDisposicoes] = useState(false);

  const [foto, setFoto] = useState<{ uri: string; name: string; type: string } | null>(null);

  useEffect(() => {
    listarRegistros('op')
      .then((r) => setOps(r.registros))
      .catch(() => {});
    listarClientesFornecedores()
      .then(setClientesFornecedores)
      .catch(() => {});
    listarUsuarios()
      .then((r) => setUsuarios(r.usuarios))
      .catch(() => {});
  }, []);

  async function onEscolherFoto() {
    const arquivo = await escolherFoto();
    if (arquivo) setFoto(arquivo);
  }

  async function handleSalvar() {
    if (!produto || !descricao) {
      alertar(
        'Atenção',
        'Por favor, preencha os campos obrigatórios (Produto ou material e Descrição).'
      );
      return;
    }

    try {
      const resultado = await criarRegistro({
        tipo: 'ocorrencia',
        titulo: 'Produto não conforme',
        status: 'Aberta',
        produto,
        lote,
        quantidade,
        processo: setorProcesso,
        responsavel,
        data,
        descricao,
        disposicao,
        opRelacionadaId: opRelacionada?.id,
        clienteFornecedorId: clienteFornecedor?.id,
      });

      if (foto) {
        await enviarAnexo(resultado.id, foto);
      }

      alertar('Sucesso', 'Não conformidade salva com sucesso!');
      navigation.navigate('OcorrenciaDetalhe', { ocorrenciaId: resultado.id });
    } catch (error: any) {
      alertar('Erro', error.message || 'Não foi possível conectar ao servidor.');
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.botaoVoltar}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>PRODUTO NÃO CONFORME</Text>
      </View>

      <ScrollView contentContainerStyle={styles.formulario}>
        {/* Produto ou material */}
        <Text style={styles.label}>Produto ou material <Text style={styles.obrigatorio}>*</Text></Text>
        <TextInput
          placeholder="Informe o produto ou material"
          placeholderTextColor={colors.textSecondary}
          value={produto}
          onChangeText={setProduto}
          style={styles.input}
        />

        {/* Lote */}
        <Text style={styles.label}>Lote ou referência (opcional)</Text>
        <TextInput
          placeholder="Informe o lote"
          placeholderTextColor={colors.textSecondary}
          value={lote}
          onChangeText={setLote}
          style={styles.input}
        />

        {/* Quantidade afetada */}
        <Text style={styles.label}>Quantidade afetada</Text>
        <TextInput
          placeholder="Informe a quantidade"
          placeholderTextColor={colors.textSecondary}
          value={quantidade}
          onChangeText={setQuantidade}
          style={styles.input}
        />

        {/* OP relacionada */}
        <Text style={styles.label}>OP relacionada (opcional)</Text>
        <TouchableOpacity style={styles.inputSeletor} onPress={() => setMostrarOps(!mostrarOps)}>
          <Text style={styles.inputTextoSimples}>{opRelacionada?.codigo || 'Selecione uma OP, se necessário'}</Text>
          <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        {mostrarOps && (
          <View style={styles.dropdownContainer}>
            <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setOpRelacionada(null);
                  setMostrarOps(false);
                }}
              >
                <Text style={styles.dropdownItemText}>Nenhuma</Text>
              </TouchableOpacity>
              {ops.map((op) => (
                <TouchableOpacity
                  key={op.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setOpRelacionada({ id: op.id, codigo: op.codigo });
                    setMostrarOps(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{op.codigo}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Cliente ou fornecedor */}
        <Text style={styles.label}>Cliente ou fornecedor (opcional)</Text>
        <TouchableOpacity
          style={styles.inputSeletor}
          onPress={() => setMostrarClientesFornecedores(!mostrarClientesFornecedores)}
        >
          <Text style={styles.inputTextoSimples}>
            {clienteFornecedor?.label || 'Selecione o cliente ou fornecedor'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        {mostrarClientesFornecedores && (
          <View style={styles.dropdownContainer}>
            <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setClienteFornecedor(null);
                  setMostrarClientesFornecedores(false);
                }}
              >
                <Text style={styles.dropdownItemText}>Nenhum</Text>
              </TouchableOpacity>
              {clientesFornecedores.map((cf) => {
                const label = `${cf.titulo} - ${cf.tipo === 'cliente' ? 'Cliente' : 'Fornecedor'}`;
                return (
                  <TouchableOpacity
                    key={cf.id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setClienteFornecedor({ id: cf.id, label });
                      setMostrarClientesFornecedores(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Setor ou processo */}
        <Text style={styles.label}>Setor ou processo</Text>
        <TouchableOpacity
          style={styles.inputSeletor}
          onPress={() => setMostrarSetores(!mostrarSetores)}
        >
          <Text style={[styles.inputTextoSimples, !setorProcesso && { color: colors.textSecondary }]}>
            {setorProcesso || 'Selecione o setor ou processo'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        {mostrarSetores && (
          <View style={styles.dropdownContainer}>
            {SETORES_PROCESSOS.map((s) => (
              <TouchableOpacity
                key={s.valor}
                style={styles.dropdownItem}
                onPress={() => {
                  setSetorProcesso(s.valor);
                  setMostrarSetores(false);
                }}
              >
                <Text style={styles.dropdownItemText}>{s.rotulo}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Responsável */}
        <Text style={styles.label}>Responsável</Text>
        <TouchableOpacity
          style={styles.inputSeletor}
          onPress={() => setMostrarResponsaveis(!mostrarResponsaveis)}
        >
          <Text style={[styles.inputTextoSimples, !responsavel && { color: colors.textSecondary }]}>
            {responsavel || 'Selecione o responsável'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        {mostrarResponsaveis && (
          <View style={styles.dropdownContainer}>
            {usuarios.map((u) => (
              <TouchableOpacity
                key={u.id}
                style={styles.dropdownItem}
                onPress={() => {
                  setResponsavel(u.nome);
                  setMostrarResponsaveis(false);
                }}
              >
                <Text style={styles.dropdownItemText}>{u.nome}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Data */}
        <Text style={styles.label}>Data</Text>
        <View style={styles.inputSeletor}>
          <TextInput
            placeholder="DD/MM/AAAA"
            placeholderTextColor={colors.textSecondary}
            value={data}
            onChangeText={(texto) => setData(aplicarMascaraData(texto))}
            keyboardType="numeric"
            style={styles.inputTextoSimples}
          />
          <Ionicons name="calendar" size={20} color={colors.textSecondary} />
        </View>

        {/* Descrição */}
        <Text style={styles.label}>Descrição da não conformidade <Text style={styles.obrigatorio}>*</Text></Text>
        <TextInput
          placeholder="Descreva o problema identificado no produto"
          placeholderTextColor={colors.textSecondary}
          value={descricao}
          onChangeText={setDescricao}
          multiline
          style={styles.inputAreaTexto}
        />

        {/* Disposição do produto */}
        <Text style={styles.label}>Disposição do produto</Text>
        <TouchableOpacity
          style={styles.inputSeletor}
          onPress={() => setMostrarDisposicoes(!mostrarDisposicoes)}
        >
          <Text style={[styles.inputTextoSimples, !disposicao && { color: colors.textSecondary }]}>
            {disposicao || 'Selecione a disposição'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        {mostrarDisposicoes && (
          <View style={styles.dropdownContainer}>
            {DISPOSICOES.map((d) => (
              <TouchableOpacity
                key={d}
                style={styles.dropdownItem}
                onPress={() => {
                  setDisposicao(d);
                  setMostrarDisposicoes(false);
                }}
              >
                <Text style={styles.dropdownItemText}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Fotos e evidências */}
        <Text style={styles.label}>Fotos e evidências</Text>
        <TouchableOpacity style={styles.botaoSecundario} activeOpacity={0.7} onPress={onEscolherFoto}>
          <Ionicons name="camera-outline" size={16} color={colors.primary} />
          <Text style={styles.botaoSecundarioTexto}>
            {foto ? ' Trocar foto ou documento' : ' Adicionar foto ou documento'}
          </Text>
        </TouchableOpacity>
        {!!foto && <Image source={{ uri: foto.uri }} style={styles.previewFoto} />}

        {/* Botão Salvar */}
        <TouchableOpacity style={styles.botaoSalvar} activeOpacity={0.8} onPress={handleSalvar}>
          <Text style={styles.botaoSalvarTexto}>Salvar não conformidade</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.screenBg },
  header: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  botaoVoltar: { marginRight: 16 },
  headerTitulo: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  formulario: { padding: 16, paddingBottom: 40 },
  obrigatorio: {
    color: colors.danger,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    height: 48,
    fontSize: 14,
    color: colors.textPrimary,
  },
  inputSeletor: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    height: 48,
    justifyContent: 'space-between',
  },
  inputTextoSimples: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    color: colors.textPrimary,
  },
  dropdownContainer: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  inputAreaTexto: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingTop: 12,
    height: 100,
    textAlignVertical: 'top',
    fontSize: 14,
    color: colors.textPrimary,
  },
  botaoSecundario: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F4F8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D0D9EE',
    paddingVertical: 10,
  },
  botaoSecundarioTexto: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  previewFoto: {
    width: 90,
    height: 90,
    borderRadius: 8,
    marginTop: 10,
    backgroundColor: colors.border,
  },
  botaoSalvar: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 24,
  },
  botaoSalvarTexto: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
