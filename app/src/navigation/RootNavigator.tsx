/**
 * Decide qual navegação mostrar:
 *  - enquanto verifica login salvo      -> tela de carregamento
 *  - depois de abrir o link de recuperar
 *    senha (e-mail do Supabase)         -> tela de redefinir senha
 *  - com usuário logado                 -> abas do app
 *  - sem usuário                        -> telas de login/cadastro
 */
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import AuthStack from './AuthStack';
import AppTabs from './AppTabs';
import RedefinirSenhaScreen from '../screens/RedefinirSenhaScreen';

export default function RootNavigator() {
  const { usuario, carregando, modoRecuperacaoSenha } = useAuth();

  if (carregando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (modoRecuperacaoSenha) {
    return <RedefinirSenhaScreen />;
  }

  return usuario ? <AppTabs /> : <AuthStack />;
}

const styles = StyleSheet.create({
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.screenBg,
  },
});
