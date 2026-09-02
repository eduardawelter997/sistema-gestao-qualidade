/**
 * Tela para adicionar um novo registro (evento) à linha do tempo de uma OP:
 * recebimento, ocorrência, retrabalho, reparo, inspeção ou inspeção final.
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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

import { colors } from '../theme/colors';
import { AppTabParamList } from '../navigation/types';
import {
  criarRegistro,
  atualizarRegistro,
  buscarRegistro,
  enviarAnexo,
  listarUsuarios,
  UsuarioResumo,
} from '../services/api';
import { alertar } from '../utils/alerta';

const TIPOS_REGISTRO: { valor: string; rotulo: string }[] = [
  { valor: 'recebimento', rotulo: 'Recebimento' },
  { valor: 'ocorrencia', rotulo: 'Ocorrência' },
  { valor: 'retrabalho', rotulo: 'Retrabalho' },
  { valor: 'reparo', rotulo: 'Reparo' },
  { valor: 'inspecao', rotulo: 'Inspeção' },
  { valor: 'inspecao_final', rotulo: 'Inspeção final' },
];

const SITUACOES = ['Aberta', 'Em andamento', 'Concluído'];

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

function dataDeHoje() {
  const hoje = new Date();
  const dia = String(hoje.getDate()).padStart(2, '0');
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}/${hoje.getFullYear()}`;
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

export default function NovoRegistroOpScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<AppTabParamList, 'NovoRegistroOp'>>();
  const { opId, opCodigo, opTitulo, opProduto, registroId } = route.params;
  const modoEdicao = !!registroId;

  const [tipoRegistro, setTipoRegistro] = useState('');
  const [mostrarTipos, setMostrarTipos] = useState(false);

  const [usuarios, setUsuarios] = useState<UsuarioResumo[]>([]);
  const [responsavel, setResponsavel] = useState('');
  const [mostrarResponsaveis, setMostrarResponsaveis] = useState(false);

  const [dataRegistro, setDataRegistro] = useState(dataDeHoje());
  const [situacao, setSituacao] = useState('Em andamento');
  const [mostrarSituacoes, setMostrarSituacoes] = useState(false);

  const [processo, setProcesso] = useState('');
  const [detalhes, setDetalhes] = useState('');
  const [foto, setFoto] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [carregando, setCarregando] = useState(modoEdicao);

  useEffect(() => {
    listarUsuarios()
      .then((r) => setUsuarios(r.usuarios))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!registroId) return;
    buscarRegistro(registroId)
      .then(({ registro }) => {
        setTipoRegistro(registro.tipo);
        setResponsavel(registro.responsavel || '');
        setDataRegistro(registro.data || dataDeHoje());
        setSituacao(registro.status);
        setProcesso(registro.processo || '');
        setDetalhes(registro.descricao || '');
      })
      .catch((e: any) => alertar('Erro', e.message))
      .finally(() => setCarregando(false));
  }, [registroId]);

  async function onEscolherFoto() {
    const arquivo = await escolherFoto();
    if (arquivo) setFoto(arquivo);
  }

  async function handleSalvar() {
    if (!tipoRegistro || !responsavel) {
      alertar(
        'Atenção',
        'Por favor, preencha os campos obrigatórios (Tipo de registro e Responsável).'
      );
      return;
    }

    const rotuloTipo = TIPOS_REGISTRO.find((t) => t.valor === tipoRegistro)?.rotulo || tipoRegistro;

    try {
      let idParaAnexo = registroId;

      if (modoEdicao && registroId) {
        await atualizarRegistro(registroId, {
          tipo: tipoRegistro,
          titulo: rotuloTipo,
          descricao: detalhes,
          status: situacao,
          responsavel,
          processo,
          data: dataRegistro || undefined,
        });
      } else {
        const resultado = await criarRegistro({
          tipo: tipoRegistro,
          titulo: rotuloTipo,
          descricao: detalhes,
          status: situacao,
          responsavel,
          processo,
          opId,
          data: dataRegistro || undefined,
        });
        idParaAnexo = resultado.id;
      }

      if (foto && idParaAnexo) {
        await enviarAnexo(idParaAnexo, foto);
      }

      alertar('Sucesso', modoEdicao ? 'Registro atualizado com sucesso!' : 'Registro salvo com sucesso!');
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
        <Text style={styles.headerTitulo}>
          {modoEdicao ? 'EDITAR REGISTRO DA OP' : 'NOVO REGISTRO DA OP'}
        </Text>
      </View>

      {carregando ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
      <ScrollView contentContainerStyle={styles.formulario}>
        {/* Resumo da OP */}
        <View style={styles.resumo}>
          <Text style={styles.resumoCodigo}>{opCodigo}</Text>
          <Text style={styles.resumoTitulo}>{opTitulo}</Text>
          {!!opProduto && <Text style={styles.resumoProduto}>Produto: {opProduto}</Text>}
        </View>

        {/* Tipo de registro */}
        <Text style={styles.label}>Tipo de registro</Text>
        <TouchableOpacity
          style={styles.inputSeletor}
          onPress={() => setMostrarTipos(!mostrarTipos)}
        >
          <Text style={[styles.inputTextoSimples, !tipoRegistro && { color: colors.textSecondary }]}>
            {TIPOS_REGISTRO.find((t) => t.valor === tipoRegistro)?.rotulo || 'Selecione o tipo de registro'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        {mostrarTipos && (
          <View style={styles.dropdownContainer}>
            {TIPOS_REGISTRO.map((t) => (
              <TouchableOpacity
                key={t.valor}
                style={styles.dropdownItem}
                onPress={() => {
                  setTipoRegistro(t.valor);
                  setMostrarTipos(false);
                }}
              >
                <Text style={styles.dropdownItemText}>{t.rotulo}</Text>
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

        {/* Data do registro e Situação lado a lado */}
        <View style={styles.linhaDupla}>
          <View style={styles.colunaMetade}>
            <Text style={styles.label}>Data do registro</Text>
            <View style={styles.inputSeletor}>
              <TextInput
                placeholder="DD/MM/AAAA"
                placeholderTextColor={colors.textSecondary}
                value={dataRegistro}
                onChangeText={(texto) => setDataRegistro(aplicarMascaraData(texto))}
                keyboardType="numeric"
                style={styles.inputTextoSimples}
              />
              <Ionicons name="calendar" size={18} color={colors.textSecondary} />
            </View>
          </View>

          <View style={styles.colunaMetade}>
            <Text style={styles.label}>Situação</Text>
            <TouchableOpacity
              style={styles.inputSeletor}
              onPress={() => setMostrarSituacoes(!mostrarSituacoes)}
            >
              <Text style={styles.inputTextoSimples}>{situacao}</Text>
              <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            {mostrarSituacoes && (
              <View style={styles.dropdownContainer}>
                {SITUACOES.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSituacao(s);
                      setMostrarSituacoes(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Processo ou etapa */}
        <Text style={styles.label}>Processo ou etapa</Text>
        <TextInput
          placeholder="Informe o processo ou etapa"
          placeholderTextColor={colors.textSecondary}
          value={processo}
          onChangeText={setProcesso}
          style={styles.inputCaixa}
        />

        {/* Detalhes do registro */}
        <Text style={styles.label}>Detalhes do registro</Text>
        <TextInput
          placeholder="Descreva o registro realizado"
          placeholderTextColor={colors.textSecondary}
          value={detalhes}
          onChangeText={setDetalhes}
          multiline
          style={styles.inputAreaTexto}
        />

        {/* Foto ou documento */}
        <TouchableOpacity style={styles.botaoSecundario} activeOpacity={0.7} onPress={onEscolherFoto}>
          <Ionicons name="camera-outline" size={16} color={colors.primary} />
          <Text style={styles.botaoSecundarioTexto}>
            {foto ? ' Trocar foto ou documento' : ' Adicionar foto ou documento'}
          </Text>
        </TouchableOpacity>
        {!!foto && <Image source={{ uri: foto.uri }} style={styles.previewFoto} />}

        {/* Botão Salvar */}
        <TouchableOpacity
          style={styles.botaoSalvar}
          activeOpacity={0.8}
          onPress={handleSalvar}
          disabled={carregando}
        >
          <Text style={styles.botaoSalvarTexto}>
            {modoEdicao ? 'Salvar alterações' : 'Salvar registro'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
      )}
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
  resumo: {
    backgroundColor: colors.cardBg,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  resumoCodigo: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  resumoTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  resumoProduto: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
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
  linhaDupla: {
    flexDirection: 'row',
    gap: 12,
  },
  colunaMetade: {
    flex: 1,
  },
  inputCaixa: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    height: 48,
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
    marginTop: 16,
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
