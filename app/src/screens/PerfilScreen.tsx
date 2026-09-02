import React, { useState, useEffect } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../components/Header';
import { colors } from '../theme/colors';

export default function PerfilScreen() {
  const navigation = useNavigation<any>();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [perfil, setPerfil] = useState('');
  const [setor, setSetor] = useState('');
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    carregarDadosUsuario();
  }, []);

  const carregarDadosUsuario = async () => {
    try {
      const token = await AsyncStorage.getItem('@gestao_qualidade:token');
      
      const resposta = await fetch('http://localhost:3000/api/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const dados = await resposta.json();

      if (resposta.ok && dados.usuario) {
        setNome(dados.usuario.nome || '');
        setEmail(dados.usuario.email || '');
        setPerfil(dados.usuario.perfil || 'Não informado');
        setSetor(dados.usuario.setor || 'Não informado');
      }
    } catch (error) {
      console.log('Erro ao carregar dados do perfil:', error);
    }
  };

  const handleSalvarAlteracoes = async () => {
    if (!nome || !email) {
      Alert.alert('Atenção', 'Nome e e-mail não podem ficar vazios.');
      return;
    }

    try {
      setCarregando(true);
      const token = await AsyncStorage.getItem('@gestao_qualidade:token');

      const resposta = await fetch('http://localhost:3000/api/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ nome, email }),
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        Alert.alert('Sucesso', dados.mensagem || 'Alterações salvas com sucesso!');
      } else {
        Alert.alert('Erro', dados.erro || 'Não foi possível salvar as alterações.');
      }
    } catch (error) {
      console.log('Erro ao salvar alterações:', error);
      Alert.alert('Erro', 'Falha ao conectar com o servidor.');
    } finally {
      setCarregando(false);
    }
  };

  const handleAlterarSenha = () => {
    navigation.navigate('AlterarSenha'); // 👈 Chama a nova tela
  };

  const iniciais = nome
    ? nome.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'US';

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.botaoVoltar}>
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.tituloTela}>Meu perfil</Text>
            <Text style={styles.subtituloTela}>Consulte e atualize suas informações</Text>
          </View>
        </View>

        {/* Card de Resumo dinâmico */}
        <View style={styles.cardResumo}>
          <View style={styles.linhaResumoAvatar}>
            <View style={styles.avatar}>
              <Text style={styles.avatarTexto}>{iniciais}</Text>
            </View>
            <Text style={styles.resumoNomeAvatar}>{nome || 'Carregando...'}</Text>
          </View>
          <View style={styles.separadorCard} />
          <Text style={styles.textoResumo}>Nome: <Text style={styles.textoResumoBold}>{nome}</Text></Text>
          <Text style={styles.textoResumo}>E-mail: <Text style={styles.textoResumoBold}>{email}</Text></Text>
          <Text style={styles.textoResumo}>Perfil: <Text style={styles.textoResumoBold}>{perfil}</Text></Text>
        </View>

        <Text style={styles.label}>Nome completo:</Text>
        <TextInput
          style={styles.input}
          value={nome}
          onChangeText={setNome}
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={styles.label}>E-mail:</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor={colors.textSecondary}
        />

        <View style={styles.linhaDupla}>
          <View style={styles.colunaMetade}>
            <Text style={styles.label}>Perfil de acesso:</Text>
            <View style={[styles.input, styles.inputDesabilitado]}>
              <Text style={styles.textoDesabilitado} numberOfLines={1}>{perfil}</Text>
            </View>
          </View>

          <View style={styles.colunaMetade}>
            <Text style={styles.label}>Setor:</Text>
            <View style={[styles.input, styles.inputDesabilitado]}>
              <Text style={styles.textoDesabilitado} numberOfLines={1}>{setor}</Text>
            </View>
          </View>
        </View>

        {/* Botão Salvar alterações */}
        <TouchableOpacity 
          style={[styles.botaoSalvar, carregando && { opacity: 0.7 }]} 
          activeOpacity={0.8} 
          onPress={handleSalvarAlteracoes}
          disabled={carregando}
        >
          <Text style={styles.botaoSalvarTexto}>
            {carregando ? 'Salvando...' : 'Salvar alterações'}
          </Text>
        </TouchableOpacity>

        {/* Botão Alterar senha */}
        <TouchableOpacity style={styles.botaoSenha} activeOpacity={0.8} onPress={handleAlterarSenha}>
          <Text style={styles.botaoSenhaTexto}>Alterar senha</Text>
        </TouchableOpacity>

        <Text style={styles.rodapeAviso}>
          Perfil e setor são gerenciados pela Gestão de Funcionários
        </Text>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.screenBg },
  content: { padding: 16, paddingBottom: 40 },
  subHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  botaoVoltar: { marginRight: 12 },
  tituloTela: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
  subtituloTela: { fontSize: 12, color: colors.textSecondary },
  cardResumo: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
  },
  linhaResumoAvatar: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  avatarTexto: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  resumoNomeAvatar: { fontSize: 15, fontWeight: 'bold', color: colors.textPrimary },
  separadorCard: { height: 1, backgroundColor: '#EAEAEA', marginBottom: 12 },
  textoResumo: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
  textoResumoBold: { color: colors.textPrimary, fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '600', color: colors.textPrimary, marginBottom: 6, marginTop: 8 },
  input: { backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, height: 48, fontSize: 14, color: colors.textPrimary, justifyContent: 'center' },
  inputDesabilitado: { backgroundColor: '#F9F9F9' },
  textoDesabilitado: { color: colors.textPrimary, fontSize: 14 },
  linhaDupla: { flexDirection: 'row', gap: 12 },
  colunaMetade: { flex: 1 },
  botaoSalvar: { backgroundColor: colors.primary, borderRadius: 8, alignItems: 'center', paddingVertical: 14, marginTop: 24 },
  botaoSalvarTexto: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  botaoSenha: { backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: colors.primary, alignItems: 'center', paddingVertical: 14, marginTop: 12 },
  botaoSenhaTexto: { color: colors.primary, fontSize: 15, fontWeight: '700' },
  rodapeAviso: { textAlign: 'center', fontSize: 11, color: colors.textSecondary, marginTop: 20 },
});