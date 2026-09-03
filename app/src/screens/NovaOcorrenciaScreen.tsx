/**
 * Tela "Nova Ocorrência" — registra um evento (erro de processo, retrabalho,
 * problema no recebimento, etc.), opcionalmente vinculado a uma OP e a um
 * cliente/fornecedor. Pode chegar pré-preenchida (ex: a partir do botão
 * "Registrar problema" da tela de detalhe de um Recebimento).
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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

import { colors } from '../theme/colors';
import { AppTabParamList } from '../navigation/types';
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

const TIPOS_OCORRENCIA = [
  'Erro de processo',
  'Retrabalho',
  'Reparo',
  'Produto fora de especificação',
  'Problema no recebimento',
  'Desperdício',
  'Perda potencial',
  'Oportunidade de melhoria',
  'Recorrência',
  'Outro',
];

const SETORES_PROCESSOS = [
  { valor: 'Produção', rotulo: 'Produção - Setor' },
  { valor: 'Qualidade', rotulo: 'Qualidade - Setor' },
  { valor: 'Almoxarifado', rotulo: 'Almoxarifado - Setor' },
  { valor: 'Laminação', rotulo: 'Laminação - Processo' },
  { valor: 'Corte', rotulo: 'Corte - Processo' },
  { valor: 'Acabamento', rotulo: 'Acabamento - Processo' },
];

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

export default function NovaOcorrenciaScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<AppTabParamList, 'NovaOcorrencia'>>();
  const {
    tipoPreSelecionado,
    opRelacionadaId,
    opRelacionadaCodigo,
    clienteFornecedorId,
    clienteFornecedorLabel,
  } = route.params || {};

  const [tipoOcorrencia, setTipoOcorrencia] = useState(tipoPreSelecionado || '');
  const [mostrarTipos, setMostrarTipos] = useState(false);

  const [ops, setOps] = useState<Registro[]>([]);
  const [opRelacionada, setOpRelacionada] = useState<{ id: number; codigo: string } | null>(
    opRelacionadaId && opRelacionadaCodigo
      ? { id: opRelacionadaId, codigo: opRelacionadaCodigo }
      : null
  );
  const [mostrarOps, setMostrarOps] = useState(false);

  const [clientesFornecedores, setClientesFornecedores] = useState<Registro[]>([]);
  const [clienteFornecedor, setClienteFornecedor] = useState<{ id: number; label: string } | null>(
    clienteFornecedorId && clienteFornecedorLabel
      ? { id: clienteFornecedorId, label: clienteFornecedorLabel }
      : null
  );
  const [mostrarClientesFornecedores, setMostrarClientesFornecedores] = useState(false);

  const [setorProcesso, setSetorProcesso] = useState('');
  const [mostrarSetores, setMostrarSetores] = useState(false);

  const [usuarios, setUsuarios] = useState<UsuarioResumo[]>([]);
  const [responsavel, setResponsavel] = useState('');
  const [mostrarResponsaveis, setMostrarResponsaveis] = useState(false);

  const [data, setData] = useState(dataDeHoje());
  const [descricao, setDescricao] = useState('');
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
    if (!tipoOcorrencia || !descricao) {
      alertar(
        'Atenção',
        'Por favor, preencha os campos obrigatórios (Tipo da ocorrência e Descrição).'
      );
      return;
    }

    try {
      const resultado = await criarRegistro({
        tipo: 'ocorrencia',
        titulo: tipoOcorrencia,
        status: 'Aberta',
        processo: setorProcesso,
        responsavel,
        data,
        descricao,
        opRelacionadaId: opRelacionada?.id,
        clienteFornecedorId: clienteFornecedor?.id,
      });

      if (foto) {
        await enviarAnexo(resultado.id, foto);
      }

      alertar('Sucesso', 'Ocorrência salva com sucesso!');
      navigation.goBack();
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
        <Text style={styles.headerTitulo}>NOVA OCORRÊNCIA</Text>
      </View>

      <ScrollView contentContainerStyle={styles.formulario}>
        {/* Tipo da ocorrência */}
        <Text style={styles.label}>Tipo da ocorrência</Text>
        <TouchableOpacity
          style={styles.inputSeletor}
          onPress={() => setMostrarTipos(!mostrarTipos)}
        >
          <Text style={[styles.inputTextoSimples, !tipoOcorrencia && { color: colors.textSecondary }]}>
            {tipoOcorrencia || 'Selecione o tipo'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        {mostrarTipos && (
          <View style={styles.dropdownContainer}>
            {TIPOS_OCORRENCIA.map((t) => (
              <TouchableOpacity
                key={t}
                style={styles.dropdownItem}
                onPress={() => {
                  setTipoOcorrencia(t);
                  setMostrarTipos(false);
                }}
              >
                <Text style={styles.dropdownItemText}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

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
            {clienteFornecedor?.label || 'Selecione cliente ou fornecedor'}
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
                <Text style={styles.dropdownItemText}>Nenhuma</Text>
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
        <Text style={styles.label}>Descrição</Text>
        <TextInput
          placeholder="Descreva a ocorrência"
          placeholderTextColor={colors.textSecondary}
          value={descricao}
          onChangeText={setDescricao}
          multiline
          style={styles.inputAreaTexto}
        />

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
          <Text style={styles.botaoSalvarTexto}>Salvar ocorrência</Text>
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
    marginTop: 12,
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
