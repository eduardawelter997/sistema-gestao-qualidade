import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DetalhesFuncionarioScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  
  // Recebe os dados do funcionário passados pela lista
  const { funcionario } = route.params || {};

  // Estado para controlar se o funcionário está ativo ou inativo na tela de detalhes
  const [statusAtual, setStatusAtual] = useState(funcionario?.status || 'Ativo');
  const isInativo = statusAtual === 'Inativo';

  // Estados dos seletores
  const [perfil, setPerfil] = useState(funcionario?.perfil || 'Gestor');
  const [mostrarListaPerfil, setMostrarListaPerfil] = useState(false);
  const perfisDisponiveis = ['Gestor da Qualidade', 'Gestor', 'Almoxarife', 'Administrativo'];

  const [setor, setSetor] = useState(funcionario?.setor || 'Desenvolvimento');
  const [mostrarListaSetor, setMostrarListaSetor] = useState(false);
  const setoresDisponiveis = [
    'Produção',
    'Qualidade',
    'Almoxarifado',
    'Fundição',
    'Usinagem',
    'Banca',
    'Desenvolvimento',
    'Administrativo',
  ];

  // Estados dos switches de permissões
  const [permissoes, setPermissoes] = useState({
    registrarRecebimentos: true,
    cadastrarClientes: true,
    adicionarFotos: true,
    registrarProblemas: true,
    definirCausaRaiz: false,
    encerrarAcoes: false,
    avaliarEficacia: false,
  });

  const alternarPermissao = (chave: keyof typeof permissoes) => {
    setPermissoes(prev => ({ ...prev, [chave]: !prev[chave] }));
  };

  const iniciais = funcionario?.nome
    ? funcionario.nome.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'MS';

  const handleSalvar = () => {
    Alert.alert('Sucesso', 'Alterações salvas com sucesso!');
    navigation.goBack();
  };

  const handleDesativar = async () => {
    console.log('Iniciando desativação direta para o ID:', funcionario?.id);

    try {
      const token = await AsyncStorage.getItem('@gestao_qualidade:token');
      console.log('Token recuperado:', token ? 'OK' : 'Vazio');

      const url = `http://localhost:3000/api/auth/desativar-funcionario/${funcionario?.id}`;
      console.log('Chamando URL:', url);

      const resposta = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const dados = await resposta.json();
      console.log('Resposta completa do servidor:', dados);

      if (resposta.ok) {
        Alert.alert('Sucesso', 'Funcionário desativado com sucesso.');
        navigation.goBack();
      } else {
        Alert.alert('Erro', dados.erro || 'Não foi possível desativar o funcionário.');
      }
    } catch (error) {
      console.log('Erro de conexão catch:', error);
      Alert.alert('Erro', 'Falha ao conectar com o servidor.');
    }
  };

  const handleAlternarStatus = async () => {
    const novaAcao = isInativo ? 'ativar' : 'desativar';
    const endpoint = `http://localhost:3000/api/auth/${novaAcao}-funcionario/${funcionario?.id}`;

    try {
      const token = await AsyncStorage.getItem('@gestao_qualidade:token');

      const resposta = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        // Alterna o status localmente para refletir na hora na tela
        setStatusAtual(isInativo ? 'Ativo' : 'Inativo');
        Alert.alert('Sucesso', dados.mensagem);
      } else {
        Alert.alert('Erro', dados.erro || 'Não foi possível alterar o status.');
      }
    } catch (error) {
      console.log('Erro de conexão:', error);
      Alert.alert('Erro', 'Falha ao conectar com o servidor.');
    }
  };

  const salvarAlteracaoPerfilSetor = async (novoPerfil: string, novoSetor: string) => {
    try {
      const token = await AsyncStorage.getItem('@gestao_qualidade:token');
      
      await fetch(`http://localhost:3000/api/auth/atualizar-perfil-setor/${funcionario?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ perfil: novoPerfil, setor: novoSetor }),
      });

      if (funcionario) {
        funcionario.perfil = novoPerfil;
        funcionario.setor = novoSetor;
      }
    } catch (error) {
      console.log('Erro ao salvar alteração:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Cabeçalho superior */}
      <View style={styles.headerTop}>
        <Text style={styles.headerTopTitle}>GRUPO SETTI</Text>
        <Ionicons name="exit-outline" size={20} color="#FFF" />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Subcabeçalho com botão voltar */}
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => navigation.navigate('GestaoFuncionarios')} style={styles.botaoVoltar}>
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.tituloTela}>Detalhes e permissões</Text>
            <Text style={styles.subtituloTela}>Gerencie os dados e acessos do funcionário</Text>
          </View>
        </View>

        {/* Card de Resumo do Funcionário */}
        <View style={styles.cardResumo}>
          <View style={styles.linhaAvatarInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarTexto}>{iniciais}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.textoLabelCard}>Nome: <Text style={styles.textoValorCard}>{funcionario?.nome || 'Mariana Souza'}</Text></Text>
              <Text style={styles.textoLabelCard}>E-mail: <Text style={styles.textoValorCard}>{funcionario?.email || 'mariana.souza@gruposetti.com.br'}</Text></Text>
              <Text style={styles.textoLabelCard}>Status: <Text style={styles.statusVerde}>{funcionario?.status || 'Ativo'}</Text></Text>
            </View>
          </View>
        </View>

        {/* Linha de Seletores (Perfil e Setor) */}
        <View style={styles.linhaSeleitores}>
          <View style={styles.colunaSeletor}>
            <Text style={styles.label}>Perfil de acesso:</Text>
            <TouchableOpacity 
              style={styles.inputSeletor} 
              onPress={() => setMostrarListaPerfil(!mostrarListaPerfil)}
            >
              <Text style={styles.inputTextoSimples}>{perfil}</Text>
              <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            {mostrarListaPerfil && (
              <View style={styles.dropdownContainer}>
                {perfisDisponiveis.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.dropdownItem}
                    onPress={() => { setPerfil(item); setMostrarListaPerfil(false); salvarAlteracaoPerfilSetor(item, setor);}}
                  >
                    <Text style={styles.dropdownItemText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.colunaSeletor}>
            <Text style={styles.label}>Setor:</Text>
            <TouchableOpacity 
              style={styles.inputSeletor} 
              onPress={() => setMostrarListaSetor(!mostrarListaSetor)}
            >
              <Text style={styles.inputTextoSimples}>{setor}</Text>
              <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            {mostrarListaSetor && (
              <View style={styles.dropdownContainer}>
                <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled={true}>
                  {setoresDisponiveis.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.dropdownItem}
                      onPress={() => { setSetor(item); setMostrarListaSetor(false); salvarAlteracaoPerfilSetor(perfil, item);}}
                    >
                      <Text style={styles.dropdownItemText}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>

        {/* Seção de Permissões */}
        <Text style={styles.secaoTitulo}>Permissões de acesso</Text>

        <View style={styles.cardPermissoes}>
          {[
            { chave: 'registrarRecebimentos', label: 'Registrar recebimentos' },
            { chave: 'cadastrarClientes', label: 'Cadastrar clientes/fornecedores' },
            { chave: 'adicionarFotos', label: 'Adicionar fotos e documentos' },
            { chave: 'registrarProblemas', label: 'Registrar problemas no recebimento' },
            { chave: 'definirCausaRaiz', label: 'Definir causa raiz' },
            { chave: 'encerrarAcoes', label: 'Encerrar ações corretivas' },
            { chave: 'avaliarEficacia', label: 'Avaliar eficácia' },
          ].map((item, idx) => (
            <View key={idx} style={styles.linhaPermissao}>
              <Text style={styles.permissaoTexto}>{item.label}</Text>
              <Switch
                trackColor={{ false: '#D9D9D9', true: colors.primary }}
                thumbColor={'#FFF'}
                ios_backgroundColor="#D9D9D9"
                onValueChange={() => alternarPermissao(item.chave as any)}
                value={permissoes[item.chave as keyof typeof permissoes]}
              />
            </View>
          ))}
        </View>

        {/* Botão Salvar alterações */}
        <TouchableOpacity style={styles.botaoSalvar} activeOpacity={0.8} onPress={handleSalvar}>
          <Text style={styles.botaoSalvarTexto}>Salvar alterações</Text>
        </TouchableOpacity>

        {/* Botão Desativar funcionário */}
        <TouchableOpacity 
          style={[styles.botaoDesativar, isInativo && styles.botaoAtivarContainer]} 
          activeOpacity={0.8} 
          onPress={handleAlternarStatus}
        >
          <Text style={[styles.botaoDesativarTexto, isInativo && styles.botaoAtivarTexto]}>
            {isInativo ? 'Ativar funcionário' : 'Desativar funcionário'}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.screenBg,
  },
  headerTop: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 45,
    paddingBottom: 16,
  },
  headerTopTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  botaoVoltar: {
    marginRight: 12,
  },
  tituloTela: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  subtituloTela: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  cardResumo: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  linhaAvatarInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarTexto: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  textoLabelCard: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  textoValorCard: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
  statusVerde: {
    color: '#137333',
    fontWeight: 'bold',
  },
  linhaSeleitores: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    zIndex: 50, // 👈 Garante que esta linha inteira fique acima do resto do card abaixo
    elevation: 5,
  },
  colunaSeletor: {
    flex: 1,
    marginRight: 8,
    position: 'relative', // 👈 Mantém o contexto para o absolute funcionar dentro dela
    zIndex: 100,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  inputSeletor: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    height: 44,
    justifyContent: 'space-between',
  },
  inputTextoSimples: {
    fontSize: 13,
    color: colors.textPrimary,
  },
  dropdownContainer: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 4,
    position: 'absolute',
    top: 65, // 👈 Logo abaixo do campo de seleção
    left: 0,
    right: 0,
    zIndex: 999, // 👈 Camada máxima
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemText: {
    fontSize: 13,
    color: colors.textPrimary,
  },
  secaoTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  cardPermissoes: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  linhaPermissao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  permissaoTexto: {
    fontSize: 13,
    color: colors.textPrimary,
    flex: 1,
    paddingRight: 8,
  },
  botaoSalvar: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 15,
    marginBottom: 12,
  },
  botaoSalvarTexto: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  botaoDesativar: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  botaoDesativarTexto: {
    color: '#D93025',
    fontSize: 14,
    fontWeight: '700',
  },

  botaoAtivarContainer: {
    borderColor: '#137333', // Borda verde quando estiver inativo para o botão de ativar
    backgroundColor: '#F6F8F6',
  },
  botaoAtivarTexto: {
    color: '#137333', // Texto verde quando for para ativar
  },
});