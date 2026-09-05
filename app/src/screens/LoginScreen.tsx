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

// Tipagem das props de navegação desta tela
type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { entrar } = useAuth();

  // Estados que guardam o que o usuário digita nos campos
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  // Ação do botão "Entrar": chama a API de autenticação
  async function handleEntrar() {
    if (!email || !senha) {
      alertar('Atenção', 'Preencha e-mail e senha para entrar.');
      return;
    }
    setCarregando(true);
    try {
      await entrar(email, senha);
      // Ao logar com sucesso, a navegação troca sozinha para as abas do app.
    } catch (e: any) {
      alertar('Erro ao entrar', e.message);
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
          <Text style={styles.title}>Sistema de Gestão da Qualidade</Text>

          {/* Campo de e-mail */}
          <Text style={styles.label}>E-mail <Text style={styles.obrigatorio}>*</Text></Text>
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

          {/* Campo de senha */}
          <Text style={styles.label}>Senha <Text style={styles.obrigatorio}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Digite sua senha"
            placeholderTextColor={colors.placeholder}
            secureTextEntry
            value={senha}
            onChangeText={setSenha}
          />

          {/* Botão principal: Entrar */}
          <TouchableOpacity
            style={styles.button}
            onPress={handleEntrar}
            disabled={carregando}
          >
            {carregando ? (
              <ActivityIndicator color={colors.textDark} />
            ) : (
              <Text style={styles.buttonText}>Entrar</Text>
            )}
          </TouchableOpacity>

          {/* Botão secundário: leva para a tela de ativação de acesso */}
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('PrimeiroAcesso')}
          >
            <Text style={styles.buttonText}>Primeiro acesso</Text>
          </TouchableOpacity>

          {/* Link "Esqueci minha senha" */}
          <TouchableOpacity onPress={() => navigation.navigate('RecuperarSenha')}>
            <Text style={styles.forgotText}>Esqueci minha senha</Text>
          </TouchableOpacity>

          {/* Dica do usuário de teste (criado pelo seed do back-end) */}
          <Text style={styles.dica}>
            Usuário de teste: anselmosetti@gmail.com / 123456
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
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
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textOnBlue,
    textAlign: 'center',
    marginBottom: 32,
  },
  obrigatorio: {
    color: colors.danger,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textOnBlue,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.inputText,
  },
  button: {
    backgroundColor: colors.white,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: colors.textDark,
    fontSize: 18,
    fontWeight: 'bold',
  },
  forgotText: {
    color: colors.link,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 24,
  },
  dica: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
  },
});
