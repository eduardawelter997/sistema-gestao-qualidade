/**
 * Tela mostrada depois que a pessoa clica no link de "esqueci minha senha"
 * recebido por e-mail (o Supabase abre o app numa sessão temporária de
 * recuperação — RootNavigator detecta isso e mostra esta tela direto, sem
 * precisar de navegação/parâmetros).
 */
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

import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { redefinirSenhaComSessaoRecuperacao } from '../services/api';
import { alertar } from '../utils/alerta';

export default function RedefinirSenhaScreen() {
  const { finalizarRecuperacaoSenha } = useAuth();
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleRedefinir() {
    if (!novaSenha || !confirmarSenha) {
      alertar('Atenção', 'Preencha todos os campos.');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      alertar('Atenção', 'As senhas não conferem.');
      return;
    }
    setCarregando(true);
    try {
      await redefinirSenhaComSessaoRecuperacao(novaSenha);
      alertar('Sucesso', 'Senha redefinida com sucesso! Entre com a nova senha.');
      await finalizarRecuperacaoSenha();
    } catch (e: any) {
      alertar('Erro', e.message);
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
          <Text style={styles.title}>Redefinir senha</Text>
          <Text style={styles.subtitle}>Crie uma nova senha para acessar sua conta</Text>

          <Text style={styles.label}>Nova senha:</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite sua nova senha"
            placeholderTextColor={colors.placeholder}
            secureTextEntry
            value={novaSenha}
            onChangeText={setNovaSenha}
          />

          <Text style={styles.label}>Confirmar nova senha:</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite sua nova senha novamente"
            placeholderTextColor={colors.placeholder}
            secureTextEntry
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleRedefinir}
            disabled={carregando}
          >
            {carregando ? (
              <ActivityIndicator color={colors.textDark} />
            ) : (
              <Text style={styles.buttonText}>Redefinir senha</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <TouchableOpacity onPress={finalizarRecuperacaoSenha}>
              <Text style={styles.loginLink}>Cancelar e voltar para Entrar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 16 },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textOnBlue,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
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
  loginLink: {
    color: colors.white,
    fontSize: 13,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
