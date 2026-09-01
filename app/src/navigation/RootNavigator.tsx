/**
 * Decide qual navegação mostrar:
 *  - enquanto verifica login salvo -> tela de carregamento
 *  - com usuário logado           -> abas do app
 *  - sem usuário                  -> telas de login/cadastro
 */
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import AuthStack from './AuthStack';
import AppTabs from './AppTabs';

export default function RootNavigator() {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
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
