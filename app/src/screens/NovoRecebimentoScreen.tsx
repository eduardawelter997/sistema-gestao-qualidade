/**
 * Tela "Novo Recebimento" — registra o recebimento de material de um cliente
 * ou fornecedor, opcionalmente vinculado a uma OP.
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

export default function NovoRecebimentoScreen() {
  const navigation = useNavigation<any>();

  const [recebimentoDe, setRecebimentoDe] = useState<'cliente' | 'fornecedor'>('fornecedor');

  const [clientesFornecedores, setClientesFornecedores] = useState<Registro[]>([]);
  const [clienteFornecedor, setClienteFornecedor] = useState<Registro | null>(null);
  const [mostrarClientesFornecedores, setMostrarClientesFornecedores] = useState(false);

  const [notaFiscal, setNotaFiscal] = useState('');
  const [material, setMaterial] = useState('');

  const [ops, setOps] = useState<Registro[]>([]);
  const [opRelacionada, setOpRelacionada] = useState<Registro | null>(null);
  const [mostrarOps, setMostrarOps] = useState(false);

  const [data, setData] = useState(dataDeHoje());

  const [usuarios, setUsuarios] = useState<UsuarioResumo[]>([]);
  const [responsavel, setResponsavel] = useState('');
  const [mostrarResponsaveis, setMostrarResponsaveis] = useState(false);

  const [comProblema, setComProblema] = useState(false);
  const [observacoes, setObservacoes] = useState('');
  const [foto, setFoto] = useState<{ uri: string; name: string; type: string } | null>(null);

  useEffect(() => {
    listarClientesFornecedores()
      .then(setClientesFornecedores)
      .catch(() => {});
    listarRegistros('op')
      .then((r) => setOps(r.registros))
      .catch(() => {});
    listarUsuarios()
      .then((r) => setUsuarios(r.usuarios))
      .catch(() => {});
  }, []);

  // Ao trocar o toggle, descarta a seleção se ela não for do tipo escolhido
  function onTrocarRecebimentoDe(tipo: 'cliente' | 'fornecedor') {
    setRecebimentoDe(tipo);
    if (clienteFornecedor && clienteFornecedor.tipo !== tipo) {
      setClienteFornecedor(null);
    }
  }

  async function onEscolherFoto() {
    const arquivo = await escolherFoto();
    if (arquivo) setFoto(arquivo);
  }

  async function handleSalvar() {
    if (!clienteFornecedor || !material) {
      alertar(
        'Atenção',
        'Por favor, preencha os campos obrigatórios (Cliente ou fornecedor e Material).'
      );
      return;
    }

    try {
      const resultado = await criarRegistro({
        tipo: 'recebimento',
        titulo: clienteFornecedor.titulo,
        status: comProblema ? 'Aguardando avaliação' : 'Concluído',
        produto: material,
        notaFiscal,
        data,
        responsavel,
        descricao: observacoes,
        comProblema,
        opRelacionadaId: opRelacionada?.id,
        clienteFornecedorId: clienteFornecedor.id,
      });

      if (foto) {
        await enviarAnexo(resultado.id, foto);
      }

      alertar('Sucesso', 'Recebimento salvo com sucesso!');
      navigation.goBack();
    } catch (error: any) {
      alertar('Erro', error.message || 'Não foi possível conectar ao servidor.');
    }
  }

  const listaFiltrada = clientesFornecedores.filter((cf) => cf.tipo === recebimentoDe);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.botaoVoltar}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>NOVO RECEBIMENTO</Text>
      </View>

      <ScrollView contentContainerStyle={styles.formulario}>
        {/* Recebimento de */}
        <Text style={styles.label}>Recebimento de</Text>
        <View style={styles.linhaTipo}>
          <TouchableOpacity
            style={[styles.botaoTipo, recebimentoDe === 'cliente' && styles.botaoTipoAtivo]}
            onPress={() => onTrocarRecebimentoDe('cliente')}
          >
            <Text
              style={[styles.textoTipo, recebimentoDe === 'cliente' && styles.textoTipoAtivo]}
            >
              Cliente
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.botaoTipo, recebimentoDe === 'fornecedor' && styles.botaoTipoAtivo]}
            onPress={() => onTrocarRecebimentoDe('fornecedor')}
          >
            <Text
              style={[styles.textoTipo, recebimentoDe === 'fornecedor' && styles.textoTipoAtivo]}
            >
              Fornecedor
            </Text>
          </TouchableOpacity>
        </View>

        {/* Cliente ou fornecedor */}
        <Text style={styles.label}>Cliente ou fornecedor <Text style={styles.obrigatorio}>*</Text></Text>
        <TouchableOpacity
          style={styles.inputSeletor}
          onPress={() => setMostrarClientesFornecedores(!mostrarClientesFornecedores)}
        >
          <Text style={[styles.inputTextoSimples, !clienteFornecedor && { color: colors.textSecondary }]}>
            {clienteFornecedor?.titulo || 'Selecione o cliente ou fornecedor'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        {mostrarClientesFornecedores && (
          <View style={styles.dropdownContainer}>
            <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled>
              {listaFiltrada.map((cf) => (
                <TouchableOpacity
                  key={cf.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setClienteFornecedor(cf);
                    setMostrarClientesFornecedores(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{cf.titulo}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <TouchableOpacity
          style={styles.botaoSecundario}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('CadastrarCliente')}
        >
          <Text style={styles.botaoSecundarioTexto}>+ Cadastrar cliente ou fornecedor</Text>
        </TouchableOpacity>

        {/* Nota fiscal e Material lado a lado */}
        <View style={styles.linhaDupla}>
          <View style={styles.colunaMetade}>
            <Text style={styles.label}>Nota fiscal</Text>
            <TextInput
              placeholder="Informe a nota fiscal"
              placeholderTextColor={colors.textSecondary}
              value={notaFiscal}
              onChangeText={setNotaFiscal}
              style={styles.inputCaixa}
            />
          </View>
          <View style={styles.colunaMetade}>
            <Text style={styles.label}>Material <Text style={styles.obrigatorio}>*</Text></Text>
            <TextInput
              placeholder="Informe o material"
              placeholderTextColor={colors.textSecondary}
              value={material}
              onChangeText={setMaterial}
              style={styles.inputCaixa}
            />
          </View>
        </View>

        {/* OP relacionada */}
        <Text style={styles.label}>OP relacionada (opcional)</Text>
        <TouchableOpacity style={styles.inputSeletor} onPress={() => setMostrarOps(!mostrarOps)}>
          <Text style={styles.inputTextoSimples} numberOfLines={1}>
            {opRelacionada?.codigo || 'Selecione a OP'}
          </Text>
          <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
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
                    setOpRelacionada(op);
                    setMostrarOps(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{op.codigo}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
          <Ionicons name="calendar" size={18} color={colors.textSecondary} />
        </View>

        {/* Responsável */}
        <Text style={styles.label}>Responsável</Text>
        <TouchableOpacity
          style={styles.inputSeletor}
          onPress={() => setMostrarResponsaveis(!mostrarResponsaveis)}
        >
          <Text style={[styles.inputTextoSimples, !responsavel && { color: colors.textSecondary }]}>
            {responsavel || 'Selecione'}
          </Text>
          <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
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

        {/* Problema no recebimento */}
        <View style={styles.linhaProblema}>
          <Text style={styles.labelSemMargem}>Problema no recebimento?</Text>
          <View style={styles.togglePequeno}>
            <TouchableOpacity
              style={[styles.botaoTipoPequeno, !comProblema && styles.botaoTipoAtivo]}
              onPress={() => setComProblema(false)}
            >
              <Text style={[styles.textoTipo, !comProblema && styles.textoTipoAtivo]}>Não</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.botaoTipoPequeno, comProblema && styles.botaoTipoAtivo]}
              onPress={() => setComProblema(true)}
            >
              <Text style={[styles.textoTipo, comProblema && styles.textoTipoAtivo]}>Sim</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Observações */}
        <Text style={styles.label}>Observações</Text>
        <TextInput
          placeholder="Descreva o recebimento ou algum problema encontrado"
          placeholderTextColor={colors.textSecondary}
          value={observacoes}
          onChangeText={setObservacoes}
          multiline
          style={styles.inputAreaTexto}
        />

        {/* Fotos e documentos */}
        <Text style={styles.label}>Fotos e documentos</Text>
        <TouchableOpacity style={styles.botaoSecundario} activeOpacity={0.7} onPress={onEscolherFoto}>
          <Ionicons name="camera-outline" size={16} color={colors.primary} />
          <Text style={styles.botaoSecundarioTexto}>
            {foto ? ' Trocar foto ou documento' : ' Adicionar foto ou documento'}
          </Text>
        </TouchableOpacity>
        {!!foto && <Image source={{ uri: foto.uri }} style={styles.previewFoto} />}

        {/* Botão Salvar */}
        <TouchableOpacity style={styles.botaoSalvar} activeOpacity={0.8} onPress={handleSalvar}>
          <Text style={styles.botaoSalvarTexto}>Salvar recebimento</Text>
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
  labelSemMargem: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  linhaProblema: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  togglePequeno: {
    flexDirection: 'row',
    gap: 8,
  },
  botaoTipoPequeno: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D0D9EE',
    backgroundColor: '#FFF',
  },
  linhaTipo: {
    flexDirection: 'row',
    gap: 12,
  },
  botaoTipo: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D0D9EE',
    backgroundColor: '#FFF',
  },
  botaoTipoAtivo: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  textoTipo: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  textoTipoAtivo: {
    color: '#FFF',
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
  botaoSecundario: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F4F8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D0D9EE',
    paddingVertical: 10,
    marginTop: 8,
  },
  botaoSecundarioTexto: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
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
