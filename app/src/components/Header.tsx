/**
 * Cabeçalho azul "GRUPO SETTI" presente no topo das telas internas,
 * com botão de sair (logout) à direita.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { confirmar } from '../utils/alerta';

export default function Header() {
  const { sair } = useAuth();

  function confirmarSaida() {
    confirmar('Sair', 'Deseja realmente sair do aplicativo?', () => sair(), 'Sair');
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.logo}>GRUPO SETTI</Text>
        <TouchableOpacity onPress={confirmarSaida} hitSlop={10}>
          <Ionicons name="exit-outline" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.headerBlue,
  },
  container: {
    height: 52,
    backgroundColor: colors.headerBlue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  logo: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
