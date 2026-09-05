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
import { redefinirSenhaComCodigo } from '../services/api';
import { alertar } from '../utils/alerta';

type Props = NativeStackScreenProps<AuthStackParamList, 'RedefinirSenha'>;

export default function RedefinirSenhaScreen({ navigation, route }: Props) {
  const { email, codigo } = route.params;
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
      await redefinirSenhaComCodigo(email, codigo, novaSenha);
      alertar('Sucesso', 'Senha redefinida com sucesso!');
      navigation.navigate('Login');
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

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
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Voltar para Entrar</Text>
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
  content: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 16 },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  backArrow: { color: colors.white, fontSize: 26 },
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
