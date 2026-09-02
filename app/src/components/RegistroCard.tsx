/**
 * Cartão que representa um registro (OP, ocorrência, ação ou recebimento)
 * usado nas telas Busca e Favoritos.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

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
  const navigation = useNavigation<any>();
  const tocavel = registro.tipo === 'op';

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={tocavel ? 0.7 : 1}
      disabled={!tocavel}
      onPress={() => navigation.navigate('OpDetalhe', { opId: registro.id })}
    >
      <View style={styles.topo}>
        <Text style={styles.codigo}>{registro.codigo}</Text>
        <StatusBadge status={registro.status} />
      </View>

      <View style={styles.linhaTitulo}>
        <Text style={styles.titulo} numberOfLines={1}>
          {registro.titulo}
        </Text>
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
        {tocavel && (
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        )}
      </View>

      <Text style={styles.subtitulo} numberOfLines={1}>
        {rotuloTipo[registro.tipo]}
        {!!registro.descricao && ` · ${registro.descricao}`}
      </Text>

      <Text style={styles.data}>{registro.data}</Text>
    </TouchableOpacity>
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
    marginBottom: 4,
  },
  codigo: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  linhaTitulo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  titulo: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  subtitulo: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  data: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
  },
});
