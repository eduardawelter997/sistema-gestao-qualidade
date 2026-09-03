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
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../components/Header';
import { colors } from '../theme/colors';

export default function AlterarSenhaScreen() {
  const navigation = useNavigation<any>();

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mensagemErro, setMensagemErro] = useState(''); // 👈 Estado para o erro na tela
  const [carregando, setCarregando] = useState(false);

  const handleSalvarSenha = async () => {
    setMensagemErro(''); // Limpa o erro anterior

    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      setMensagemErro('Preencha todos os campos obrigatórios.');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setMensagemErro('A nova senha e a confirmação não coincidem.');
      return;
    }

    try {
      setCarregando(true);
      const token = await AsyncStorage.getItem('@gestao_qualidade:token');

      const resposta = await fetch('http://localhost:3000/api/auth/senha', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ senhaAtual, novaSenha }),
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        setSenhaAtual('');
        setNovaSenha('');
        setConfirmarSenha('');

        Alert.alert(
          'Sucesso', 
          dados.mensagem || 'Senha alterada com sucesso!', 
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        // Exibe a mensagem de erro direto na interface em vermelho
        setMensagemErro(dados.erro || dados.message || 'Senha atual incorreta.');
      }
    } catch (error) {
      console.log('Erro ao alterar senha:', error);
      setMensagemErro('Falha ao conectar com o servidor.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.botaoVoltar}>
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.tituloTela}>Alterar senha</Text>
            <Text style={styles.subtituloTela}>Digite sua senha atual e escolha uma nova</Text>
          </View>
        </View>

        {/* Exibe o aviso de erro em vermelho se houver */}
        {mensagemErro ? (
          <View style={styles.boxErro}>
            <Ionicons name="alert-circle" size={18} color="#D9534F" style={{ marginRight: 6 }} />
            <Text style={styles.textoErro}>{mensagemErro}</Text>
          </View>
        ) : null}

        <Text style={styles.label}>Senha atual: <Text style={styles.obrigatorio}>*</Text></Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={senhaAtual}
          onChangeText={(texto) => { setSenhaAtual(texto); setMensagemErro(''); }}
          placeholder="Digite sua senha atual"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={styles.label}>Nova senha: <Text style={styles.obrigatorio}>*</Text></Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={novaSenha}
          onChangeText={(texto) => { setNovaSenha(texto); setMensagemErro(''); }}
          placeholder="Digite a nova senha"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={styles.label}>Confirmar nova senha: <Text style={styles.obrigatorio}>*</Text></Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={confirmarSenha}
          onChangeText={(texto) => { setConfirmarSenha(texto); setMensagemErro(''); }}
          placeholder="Confirme a nova senha"
          placeholderTextColor={colors.textSecondary}
        />

        <TouchableOpacity 
          style={[styles.botaoSalvar, carregando && { opacity: 0.7 }]} 
          activeOpacity={0.8} 
          onPress={handleSalvarSenha}
          disabled={carregando}
        >
          <Text style={styles.botaoSalvarTexto}>
            {carregando ? 'Salvando...' : 'Salvar nova senha'}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.screenBg },
  content: { padding: 16, paddingBottom: 40 },
  subHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  botaoVoltar: { marginRight: 12 },
  tituloTela: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
  subtituloTela: { fontSize: 12, color: colors.textSecondary },
  boxErro: {
    backgroundColor: '#FFD2D2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D9534F',
  },
  textoErro: { color: '#A94442', fontSize: 13, fontWeight: '600', flex: 1 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textPrimary, marginBottom: 6, marginTop: 12 },
  obrigatorio: { color: colors.danger },
  input: { backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, height: 48, fontSize: 14, color: colors.textPrimary },
  botaoSalvar: { backgroundColor: colors.primary, borderRadius: 8, alignItems: 'center', paddingVertical: 14, marginTop: 24 },
  botaoSalvarTexto: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});