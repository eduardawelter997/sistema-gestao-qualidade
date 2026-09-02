import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { listarRegistros, criarRegistro, listarUsuarios, UsuarioResumo } from '../services/api';
import { alertar } from '../utils/alerta';

function dataDeHoje() {
  const hoje = new Date();
  const dia = String(hoje.getDate()).padStart(2, '0');
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}/${hoje.getFullYear()}`;
}

export default function NovaOpScreen() {
  const navigation = useNavigation<any>();

  // Estados do formulário
  const [cliente, setCliente] = useState('');
  const [clientesLista, setClientesLista] = useState<any[]>([]);
  const [mostrarListaClientes, setMostrarListaClientes] = useState(false);

  const [responsavel, setResponsavel] = useState('');
  const [usuarios, setUsuarios] = useState<UsuarioResumo[]>([]);
  const [mostrarListaResponsaveis, setMostrarListaResponsaveis] = useState(false);
  const [dataAbertura, setDataAbertura] = useState(dataDeHoje());
  const [produto, setProduto] = useState('');
  const [numeroOp, setNumeroOp] = useState('');
  
  // Estados para o Tipo de Processo
  const [tipoProcesso, setTipoProcesso] = useState('');
  const [mostrarListaProcesso, setMostrarListaProcesso] = useState(false);
  const tiposProcessoOp = ['Laminação', 'Corte', 'Acabamento'];

  // Estados para a Situação da Ordem
  const [situacao, setSituacao] = useState('Em andamento');
  const [mostrarListaSituacao, setMostrarListaSituacao] = useState(false);
  const situacoesOp = ['Aberta', 'Em andamento', 'Concluído'];

  useEffect(() => {
    carregarClientes();
    carregarUsuarios();
  }, []);

  const carregarClientes = async () => {
    try {
      const { registros } = await listarRegistros('cliente');
      setClientesLista(registros);
    } catch (error) {
      console.log('Erro ao carregar do banco:', error);
    }
  };

  const carregarUsuarios = async () => {
    try {
      const { usuarios } = await listarUsuarios();
      setUsuarios(usuarios);
    } catch (error) {
      console.log('Erro ao carregar usuários:', error);
    }
  };

  const aplicarMascaraData = (texto: string) => {
    const apenasNumeros = texto.replace(/\D/g, '').slice(0, 8);
    if (apenasNumeros.length > 4) {
      return `${apenasNumeros.slice(0, 2)}/${apenasNumeros.slice(2, 4)}/${apenasNumeros.slice(4)}`;
    }
    if (apenasNumeros.length > 2) {
      return `${apenasNumeros.slice(0, 2)}/${apenasNumeros.slice(2)}`;
    }
    return apenasNumeros;
  };

  const handleSalvarOp = async () => {
    if (!numeroOp || !cliente || !responsavel || !tipoProcesso) {
      alertar('Atenção', 'Por favor, preencha os campos obrigatórios (Cliente, Responsável, Número da OP e Tipo de processo).');
      return;
    }

    try {
      const ano = new Date().getFullYear();
      const codigo = `OP-${ano}-${numeroOp.padStart(5, '0')}`;

      await criarRegistro({
        tipo: 'op',
        codigo,
        titulo: cliente,
        status: situacao,
        responsavel,
        produto,
        processo: tipoProcesso,
        data: dataAbertura || undefined,
      });

      alertar('Sucesso', 'Ordem de produção salva com sucesso no banco!');
      navigation.goBack();
    } catch (error: any) {
      alertar('Erro', error.message || 'Não foi possível conectar ao servidor.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.botaoVoltar}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>NOVA ORDEM DE PRODUÇÃO</Text>
      </View>

      <ScrollView contentContainerStyle={styles.formulario}>
        
        {/* Cliente */}
        <Text style={styles.label}>Cliente</Text>
        <View style={styles.inputSeletor}>
          <TextInput
            placeholder="Digite ou selecione o cliente"
            placeholderTextColor={colors.textSecondary}
            value={cliente}
            onChangeText={setCliente}
            style={styles.inputTextoSimples}
          />
          <TouchableOpacity onPress={() => setMostrarListaClientes(!mostrarListaClientes)}>
            <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {mostrarListaClientes && (
          <View style={styles.dropdownContainer}>
            <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled={true}>
              {clientesLista.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setCliente(item.titulo || item.nome);
                    setMostrarListaClientes(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{item.titulo || item.nome}</Text>
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
          <Text style={styles.botaoSecundarioTexto}>+ Cadastrar cliente</Text>
        </TouchableOpacity>

        {/* Responsável */}
        <Text style={styles.label}>Responsável</Text>
        <TouchableOpacity
          style={styles.inputSeletor}
          onPress={() => setMostrarListaResponsaveis(!mostrarListaResponsaveis)}
        >
          <Text style={[styles.inputTextoSimples, !responsavel && { color: colors.textSecondary }]}>
            {responsavel || 'Selecione o responsável'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        {mostrarListaResponsaveis && (
          <View style={styles.dropdownContainer}>
            {usuarios.map((u) => (
              <TouchableOpacity
                key={u.id}
                style={styles.dropdownItem}
                onPress={() => {
                  setResponsavel(u.nome);
                  setMostrarListaResponsaveis(false);
                }}
              >
                <Text style={styles.dropdownItemText}>{u.nome}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Data de Abertura */}
        <Text style={styles.label}>Data de abertura</Text>
        <View style={styles.inputSeletor}>
          <TextInput
            placeholder="DD/MM/AAAA"
            placeholderTextColor={colors.textSecondary}
            value={dataAbertura}
            onChangeText={(texto) => setDataAbertura(aplicarMascaraData(texto))}
            keyboardType="numeric"
            style={styles.inputTextoSimples}
          />
          <Ionicons name="calendar" size={20} color={colors.textSecondary} />
        </View>

        {/* Produto ou referência */}
        <Text style={styles.label}>Produto ou referência</Text>
        <TextInput
          placeholder="Informe o produto ou a referência"
          placeholderTextColor={colors.textSecondary}
          value={produto}
          onChangeText={setProduto}
          multiline
          style={styles.inputAreaTexto}
        />

        {/* Número da OP */}
        <Text style={styles.label}>Número da OP</Text>
        <TextInput
          placeholder="Informe o número da OP"
          placeholderTextColor={colors.textSecondary}
          value={numeroOp}
          onChangeText={setNumeroOp}
          keyboardType="numeric"
          style={styles.inputCaixa}
        />

        {/* Tipo de processo e Situação da ordem (Lado a lado) */}
        <View style={styles.linhaDupla}>
          
          {/* Tipo de Processo */}
          <View style={styles.colunaMetade}>
            <Text style={styles.label}>Tipo de processo</Text>
            <TouchableOpacity 
              style={styles.inputSeletor} 
              onPress={() => setMostrarListaProcesso(!mostrarListaProcesso)}
            >
              <Text style={[styles.inputTextoSimples, !tipoProcesso && { color: colors.textSecondary }]}>
                {tipoProcesso || 'Selecione'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            {mostrarListaProcesso && (
              <View style={styles.dropdownContainer}>
                {tiposProcessoOp.map((processo, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setTipoProcesso(processo);
                      setMostrarListaProcesso(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{processo}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Situação da Ordem */}
          <View style={styles.colunaMetade}>
            <Text style={styles.label}>Situação da ordem</Text>
            <TouchableOpacity 
              style={styles.inputSeletor} 
              onPress={() => setMostrarListaSituacao(!mostrarListaSituacao)}
            >
              <Text style={styles.inputTextoSimples}>{situacao}</Text>
              <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            {mostrarListaSituacao && (
              <View style={styles.dropdownContainer}>
                {situacoesOp.map((statusItem, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSituacao(statusItem);
                      setMostrarListaSituacao(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{statusItem}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

        </View>

        {/* Botão Salvar OP */}
        <TouchableOpacity style={styles.botaoSalvar} activeOpacity={0.8} onPress={handleSalvarOp}>
          <Text style={styles.botaoSalvarTexto}>Salvar OP</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.screenBg 
  },
  header: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  botaoVoltar: {
    marginRight: 16,
  },
  headerTitulo: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  formulario: {
    padding: 16,
    paddingBottom: 40,
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
  botaoSecundario: {
    backgroundColor: '#F0F4F8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D0D9EE',
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 8,
  },
  botaoSecundarioTexto: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
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
  linhaDupla: {
    flexDirection: 'row',
    gap: 12,
  },
  colunaMetade: {
    flex: 1,
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