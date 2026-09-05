import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors } from '../theme/colors';
import { AuthStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { alertar } from '../utils/alerta';
import TermosModal from '../components/TermosModal';

type Props = NativeStackScreenProps<AuthStackParamList, 'PrimeiroAcesso'>;

export default function PrimeiroAcessoScreen({ navigation }: Props) {
  const { ativarAcesso } = useAuth();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [mostrarTermos, setMostrarTermos] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function handleAtivar() {
    if (!nome || !email || !senha) {
      alertar('Atenção', 'Preencha todos os campos.');
      return;
    }
    if (!aceitouTermos) {
      alertar('Atenção', 'É preciso aceitar os Termos de Uso.');
      return;
    }
    setCarregando(true);
    try {
      await ativarAcesso(nome, email, senha);
      // Ativação bem-sucedida já faz login automático e entra no app.
    } catch (e: any) {
      alertar('Erro ao ativar acesso', e.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Primeiro acesso</Text>
          <Text style={styles.subtitle}>Ative o acesso criado pela empresa</Text>

          <Text style={styles.label}>Nome completo:</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite seu nome completo"
            placeholderTextColor={colors.placeholder}
            value={nome}
            onChangeText={setNome}
          />

          <Text style={styles.label}>E-mail corporativo cadastrado pelo gestor:</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite seu e-mail"
            placeholderTextColor={colors.placeholder}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Digite a senha inicial:</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite sua senha"
            placeholderTextColor={colors.placeholder}
            secureTextEntry
            value={senha}
            onChangeText={setSenha}
          />

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setAceitouTermos((valor) => !valor)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, aceitouTermos && styles.checkboxMarcado]}>
              {aceitouTermos && <Text style={styles.checkboxCheck}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>
              Li e aceito os{' '}
              <Text style={styles.checkboxLink} onPress={() => setMostrarTermos(true)}>
                Termos de Uso e a Política de Privacidade
              </Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={handleAtivar}
            disabled={carregando}
          >
            {carregando ? (
              <ActivityIndicator color={colors.textDark} />
            ) : (
              <Text style={styles.buttonText}>Ativar acesso</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Já ativou seu acesso? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Entrar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <TermosModal visivel={mostrarTermos} aoFechar={() => setMostrarTermos(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backArrow: {
    color: colors.white,
    fontSize: 26,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textOnBlue,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textOnBlue,
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.inputText,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.white,
    marginRight: 10,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxMarcado: {
    backgroundColor: colors.white,
  },
  checkboxCheck: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    flex: 1,
    color: colors.textOnBlue,
    fontSize: 13,
  },
  checkboxLink: {
    textDecorationLine: 'underline',
    fontWeight: '700',
  },
  button: {
    backgroundColor: colors.white,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: {
    color: colors.textDark,
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: colors.textOnBlue,
    fontSize: 13,
  },
  loginLink: {
    color: colors.white,
    fontSize: 13,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
