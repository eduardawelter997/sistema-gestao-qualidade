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
import { verificarCodigoRecuperacao } from '../services/api';
import { alertar } from '../utils/alerta';

type Props = NativeStackScreenProps<AuthStackParamList, 'VerificarCodigo'>;

export default function VerificarCodigoScreen({ navigation, route }: Props) {
  const { email } = route.params;
  const [codigo, setCodigo] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleVerificar() {
    if (!codigo) {
      alertar('Atenção', 'Digite o código de verificação.');
      return;
    }
    setCarregando(true);
    try {
      await verificarCodigoRecuperacao(email, codigo);
      navigation.navigate('RedefinirSenha', { email, codigo });
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

          <Text style={styles.title}>Verificar código</Text>
          <Text style={styles.subtitle}>
            Digite o código padrão de recuperação de senha
          </Text>

          <Text style={styles.label}>Código de verificação:</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite o código de 6 dígitos"
            placeholderTextColor={colors.placeholder}
            keyboardType="numeric"
            maxLength={6}
            value={codigo}
            onChangeText={setCodigo}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleVerificar}
            disabled={carregando}
          >
            {carregando ? (
              <ActivityIndicator color={colors.textDark} />
            ) : (
              <Text style={styles.buttonText}>Verificar código</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Não sabe o código? Fale com o gestor do sistema.</Text>
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
  loginText: {
    color: colors.textOnBlue,
    fontSize: 13,
    textAlign: 'center',
  },
});
