/**
 * Tela Favoritos.
 * Lista apenas os registros marcados com estrela. Ao desmarcar,
 * o item sai da lista.
 */
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import Header from '../components/Header';
import RegistroCard from '../components/RegistroCard';
import { colors } from '../theme/colors';
import { listarFavoritos, alternarFavorito, Registro } from '../services/api';

export default function FavoritosScreen() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const { registros } = await listarFavoritos();
      setRegistros(registros);
    } catch {
      setRegistros([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  async function onFavoritar(id: number) {
    // Remove da lista de favoritos imediatamente
    setRegistros((atual) => atual.filter((r) => r.id !== id));
    try {
      await alternarFavorito(id);
    } catch {
      carregar();
    }
  }

  return (
    <View style={styles.container}>
      <Header />
      <Text style={styles.titulo}>Favoritos</Text>

      {carregando ? (
        <ActivityIndicator
          color={colors.primary}
          size="large"
          style={{ marginTop: 30 }}
        />
      ) : (
        <FlatList
          data={registros}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => (
            <RegistroCard registro={item} aoAlternarFavorito={onFavoritar} />
          )}
          ListEmptyComponent={
            <Text style={styles.vazio}>
              Você ainda não marcou nenhum registro como favorito.
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.screenBg },
  titulo: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginHorizontal: 16,
    marginTop: 14,
  },
  lista: { padding: 16, paddingTop: 10 },
  vazio: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 40,
    paddingHorizontal: 24,
  },
});
