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

type Props = NativeStackScreenProps<AuthStackParamList, 'Cadastro'>;

export default function CadastroScreen({ navigation }: Props) {
  const { cadastrar } = useAuth();

  // Estados dos campos do formulário
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [carregando, setCarregando] = useState(false);

  // Valida os dados e cria a conta na API
  async function handleCriarConta() {
    if (!nome || !email || !senha || !confirmarSenha) {
      alertar('Atenção', 'Preencha todos os campos.');
      return;
    }
    if (senha !== confirmarSenha) {
      alertar('Atenção', 'As senhas não conferem.');
      return;
    }
    if (!aceitouTermos) {
      alertar('Atenção', 'É preciso aceitar os Termos de Uso.');
      return;
    }
    setCarregando(true);
    try {
      await cadastrar(nome, email, senha);
      // Cadastro bem-sucedido já faz login automático e entra no app.
    } catch (e: any) {
      alertar('Erro ao criar conta', e.message);
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
          {/* Cabeçalho com botão de voltar e título */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Criar conta</Text>

          {/* Nome completo */}
          <Text style={styles.label}>Nome completo:</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite seu nome completo"
            placeholderTextColor={colors.placeholder}
            value={nome}
            onChangeText={setNome}
          />

          {/* E-mail */}
          <Text style={styles.label}>E-mail:</Text>
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

          {/* Senha */}
          <Text style={styles.label}>Senha:</Text>
          <TextInput
            style={styles.input}
            placeholder="Criar uma senha"
            placeholderTextColor={colors.placeholder}
            secureTextEntry
            value={senha}
            onChangeText={setSenha}
          />

          {/* Confirmar senha */}
          <Text style={styles.label}>Confirmar senha</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite sua senha novamente"
            placeholderTextColor={colors.placeholder}
            secureTextEntry
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
          />

          {/* Checkbox de aceite dos termos (feito manualmente com View) */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setAceitouTermos((valor) => !valor)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.checkbox,
                aceitouTermos && styles.checkboxMarcado,
              ]}
            >
              {aceitouTermos && <Text style={styles.checkboxCheck}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>
              Li e aceito os Termos de Uso e a Política de Privacidade
            </Text>
          </TouchableOpacity>

          {/* Botão Criar conta */}
          <TouchableOpacity
            style={styles.button}
            onPress={handleCriarConta}
            disabled={carregando}
          >
            {carregando ? (
              <ActivityIndicator color={colors.textDark} />
            ) : (
              <Text style={styles.buttonText}>Criar conta</Text>
            )}
          </TouchableOpacity>

          {/* Link para voltar ao login */}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Já possui uma conta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Entrar</Text>
            </TouchableOpacity>
          </View>
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
    marginBottom: 24,
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
    alignItems: 'center',
    marginTop: 20,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.white,
    marginRight: 10,
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
