/**
 * Cartão que representa um registro (OP, ocorrência, ação ou recebimento)
 * usado nas telas Busca e Favoritos.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import StatusBadge from './StatusBadge';
import { Registro } from '../services/api';

// Rótulo amigável para cada tipo de registro
const rotuloTipo: Record<Registro['tipo'], string> = {
  op: 'Ordem de Produção',
  ocorrencia: 'Ocorrência',
  acao: 'Ação Corretiva',
  recebimento: 'Recebimento',
};

interface Props {
  registro: Registro;
  aoAlternarFavorito?: (id: number) => void;
}

export default function RegistroCard({ registro, aoAlternarFavorito }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.topo}>
        <Text style={styles.tipo}>{rotuloTipo[registro.tipo]}</Text>
        <StatusBadge status={registro.status} />
      </View>

      <View style={styles.linhaTitulo}>
        <Text style={styles.titulo}>{registro.titulo}</Text>
        {aoAlternarFavorito && (
          <TouchableOpacity
            onPress={() => aoAlternarFavorito(registro.id)}
            hitSlop={8}
          >
            <Ionicons
              name={registro.favorito ? 'star' : 'star-outline'}
              size={20}
              color={registro.favorito ? '#F5B301' : colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.codigo}>{registro.codigo}</Text>
      {!!registro.descricao && (
        <Text style={styles.descricao}>{registro.descricao}</Text>
      )}
      <Text style={styles.data}>Data: {registro.data}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  tipo: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  linhaTitulo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titulo: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  codigo: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  descricao: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  data: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'right',
  },
});
