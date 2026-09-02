import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ConvidarFuncionarioScreen() {
  const navigation = useNavigation<any>();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  // Perfil de acesso
  const [perfil, setPerfil] = useState('');
  const [mostrarListaPerfil, setMostrarListaPerfil] = useState(false);
  const perfisDisponiveis = ['Gestor da Qualidade', 'Gestor', 'Almoxarife'];

  // Setor atualizado com as novas opções
  const [setor, setSetor] = useState('');
  const [mostrarListaSetor, setMostrarListaSetor] = useState(false);
  const setoresDisponiveis = [
    'Produção',
    'Qualidade',
    'Almoxarifado',
    'Fundição',
    'Usinagem',
    'Banca',
    'Desenvolvimento',
  ];

  const handleCadastrarAcesso = async () => {
    if (!nome || !email || !senha || !perfil || !setor) {
      Alert.alert('Atenção', 'Por favor, preencha todos os campos, incluindo a senha de acesso.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('@gestao_qualidade:token');

      const novoUsuarioLogin = {
        tipo: 'funcionario',
        titulo: nome,
        email: email,
        senha: senha,
        descricao: `${perfil} | Setor: ${setor}`,
        status: 'Ativo',
        iniciais: nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
      };

      const resposta = await fetch('http://localhost:3000/api/auth/cadastrar-funcionario', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
        nome,
        email,
        senha,
        perfil,
        setor,
        }), 
      });

      if (resposta.ok) {
        // Limpa os campos do formulário antes de sair
        setNome('');
        setEmail('');
        setSenha('');
        setPerfil('');
        setSetor('');

        Alert.alert('Sucesso', 'Acesso do funcionário cadastrado com sucesso!');
        navigation.navigate('GestaoFuncionarios');
      } else {
        Alert.alert('Erro', 'O servidor recusou o cadastro do acesso.');
      }
    } catch (error) {
      console.log('Erro ao conectar com a API:', error);
      Alert.alert('Erro', 'Não foi possível conectar ao servidor.');
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
        {/* Subcabeçalho */}
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => navigation.navigate('GestaoFuncionarios')} style={styles.botaoVoltar}>
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.tituloTela}>Cadastrar Acesso</Text>
            <Text style={styles.subtituloTela}>Crie as credenciais de login do funcionário</Text>
          </View>
        </View>

        {/* Nome Completo */}
        <Text style={styles.label}>Nome completo:</Text>
        <TextInput
          placeholder="Digite o nome completo"
          placeholderTextColor={colors.textSecondary}
          value={nome}
          onChangeText={setNome}
          style={styles.inputCaixa}
        />

        {/* E-mail corporativo */}
        <Text style={styles.label}>E-mail corporativo (Login):</Text>
        <TextInput
          placeholder="Digite o e-mail de acesso"
          placeholderTextColor={colors.textSecondary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.inputCaixa}
        />

        {/* Senha Inicial */}
        <Text style={styles.label}>Senha inicial:</Text>
        <TextInput
          placeholder="Digite a senha temporária de acesso"
          placeholderTextColor={colors.textSecondary}
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
          style={styles.inputCaixa}
        />

        {/* Perfil de acesso */}
        <Text style={styles.label}>Perfil de acesso:</Text>
        <TouchableOpacity 
          style={styles.inputSeletor} 
          onPress={() => setMostrarListaPerfil(!mostrarListaPerfil)}
        >
          <Text style={[styles.inputTextoSimples, !perfil && { color: colors.textSecondary }]}>
            {perfil || 'Selecione o perfil'}
          </Text>
          <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {mostrarListaPerfil && (
          <View style={styles.dropdownContainer}>
            {perfisDisponiveis.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.dropdownItem}
                onPress={() => {
                  setPerfil(item);
                  setMostrarListaPerfil(false);
                }}
              >
                <Text style={styles.dropdownItemText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Setor */}
        <Text style={styles.label}>Setor:</Text>
        <TouchableOpacity 
          style={styles.inputSeletor} 
          onPress={() => setMostrarListaSetor(!mostrarListaSetor)}
        >
          <Text style={[styles.inputTextoSimples, !setor && { color: colors.textSecondary }]}>
            {setor || 'Selecione o setor'}
          </Text>
          <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {mostrarListaSetor && (
          <View style={styles.dropdownContainer}>
            <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled={true}>
              {setoresDisponiveis.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSetor(item);
                    setMostrarListaSetor(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Botão Cadastrar Acesso */}
        <TouchableOpacity style={styles.botaoEnviar} activeOpacity={0.8} onPress={handleCadastrarAcesso}>
          <Text style={styles.botaoEnviarTexto}>Salvar e Criar Acesso</Text>
        </TouchableOpacity>

        <Text style={styles.rodapeAviso}>
          O funcionário poderá usar este e-mail e senha para logar diretamente no aplicativo.
        </Text>

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
    marginBottom: 20,
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
    marginTop: 12,
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
  botaoEnviar: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 24,
  },
  botaoEnviarTexto: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  rodapeAviso: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
});