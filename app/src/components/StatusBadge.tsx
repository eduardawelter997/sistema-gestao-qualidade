/**
 * "Pílula" colorida que mostra o status de um registro
 * (Em andamento, Aberta, Concluído, Atrasada, etc.).
 */
import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { corDoStatus } from '../theme/colors';

export default function StatusBadge({ status }: { status: string }) {
  const { bg, text } = corDoStatus(status);
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.texto, { color: text }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  texto: {
    fontSize: 11,
    fontWeight: '700',
  },
});
