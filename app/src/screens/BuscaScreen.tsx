/**
 * Tela Busca.
 * Permite pesquisar registros por texto e filtrar por tipo.
 * Também permite marcar/desmarcar favoritos (estrela).
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Header from '../components/Header';
import RegistroCard from '../components/RegistroCard';
import { colors } from '../theme/colors';
import {
  listarRegistros,
  listarClientesFornecedores,
  alternarFavorito,
  Registro,
} from '../services/api';

// Filtros disponíveis (valor enviado à API + rótulo exibido)
const FILTROS = [
  { valor: 'todos', rotulo: 'Todos' },
  { valor: 'op', rotulo: 'OP' },
  { valor: 'ocorrencia', rotulo: 'Ocorrência' },
  { valor: 'recebimento', rotulo: 'Recebimento' },
  { valor: 'acao', rotulo: 'Ações' },
];

export default function BuscaScreen() {
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [carregando, setCarregando] = useState(false);

  const [listaClientes, setListaClientes] = useState<any[]>([]);
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState<number | null>(null);
  const [clienteSelecionadoNome, setClienteSelecionadoNome] = useState('Todos os clientes e fornecedores');
  const [mostrarClientes, setMostrarClientes] = useState(false);

  useEffect(() => {
    listarClientesFornecedores()
      .then(setListaClientes)
      .catch(() => setListaClientes([]));
  }, []);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const { registros } = await listarRegistros(filtro, busca, clienteSelecionadoId);
      setRegistros(registros);
    } catch {
      setRegistros([]);
    } finally {
      setCarregando(false);
    }
  }, [filtro, busca, clienteSelecionadoId]);

  // Recarrega quando muda o filtro ou o texto (com pequeno atraso para a digitação)
  useEffect(() => {
    const timer = setTimeout(carregar, 300);
    return () => clearTimeout(timer);
  }, [carregar]);

  async function onFavoritar(id: number) {
    // Atualiza na tela imediatamente (otimista) e depois confirma na API
    setRegistros((atual) =>
      atual.map((r) => (r.id === id ? { ...r, favorito: r.favorito ? 0 : 1 } : r))
    );
    try {
      await alternarFavorito(id);
    } catch {
      carregar(); // se falhar, recarrega o estado real
    }
  }

  return (
    <View style={styles.container}>
      <Header />

      {/* Barra de busca */}
      <View style={styles.buscaWrapper}>
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          style={styles.buscaInput}
          placeholder="Nº da OP, cliente, fornecedor ou produto..."
          placeholderTextColor={colors.placeholder}
          value={busca}
          onChangeText={setBusca}
        />
      </View>

      {/* Filtros por tipo */}
      <View style={styles.filtros}>
        {FILTROS.map((f) => {
          const ativo = filtro === f.valor;
          return (
            <TouchableOpacity
              key={f.valor}
              style={[styles.chip, ativo && styles.chipAtivo]}
              onPress={() => setFiltro(f.valor)}
            >
              <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>
                {f.rotulo}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Filtro por cliente/fornecedor */}
      <View style={styles.filtroClienteWrapper}>
        <TouchableOpacity
          style={styles.dropdownBox}
          activeOpacity={0.8}
          onPress={() => setMostrarClientes((atual) => !atual)}
        >
          <Text style={styles.dropdownTexto} numberOfLines={1}>
            {clienteSelecionadoNome}
          </Text>
          <Ionicons
            name={mostrarClientes ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
        {mostrarClientes && (
          <View style={styles.dropdownContainer}>
            <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setClienteSelecionadoId(null);
                  setClienteSelecionadoNome('Todos os clientes e fornecedores');
                  setMostrarClientes(false);
                }}
              >
                <Text style={styles.dropdownItemTextoDestaque}>Todos os clientes e fornecedores</Text>
              </TouchableOpacity>
              {listaClientes.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setClienteSelecionadoId(item.id);
                    setClienteSelecionadoNome(item.titulo || 'Cliente');
                    setMostrarClientes(false);
                  }}
                >
                  <Text style={styles.dropdownItemTexto} numberOfLines={1}>
                    {item.titulo} <Text style={styles.tipoTexto}>· {item.tipo || 'Cliente'}</Text>
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Lista */}
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
            <Text style={styles.vazio}>Nenhum registro encontrado.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.screenBg },
  buscaWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buscaInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 14,
    color: colors.inputText,
  },
  filtros: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipAtivo: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipTexto: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  chipTextoAtivo: {
    color: colors.white,
  },
  filtroClienteWrapper: {
    paddingHorizontal: 16,
    marginTop: 4,
  },
  dropdownBox: {
    backgroundColor: colors.cardBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 40,
  },
  dropdownTexto: { flex: 1, fontSize: 13, color: colors.textPrimary, marginRight: 8 },
  dropdownContainer: {
    backgroundColor: colors.cardBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemTexto: { fontSize: 13, color: colors.textPrimary },
  dropdownItemTextoDestaque: { fontSize: 13, fontWeight: 'bold', color: colors.primary },
  tipoTexto: { color: colors.textSecondary, fontSize: 12 },
  lista: {
    padding: 16,
    paddingTop: 10,
  },
  vazio: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 30,
  },
});
