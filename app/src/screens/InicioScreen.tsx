/**
 * Tela Início (dashboard).
 * Mostra a "Visão geral" com números vindos da API, atalhos de ação
 * e a lista de registros recentes.
 */
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import Header from '../components/Header';
import StatusBadge from '../components/StatusBadge';
import { colors } from '../theme/colors';
import { buscarDashboard, DashboardResposta } from '../services/api';

// Cartão de número da "Visão geral"
function CartaoIndicador({
  titulo,
  valor,
  cor,
}: {
  titulo: string;
  valor: number;
  cor: string;
}) {
  return (
    <View style={styles.indicador}>
      <Text style={styles.indicadorTitulo}>{titulo}</Text>
      <Text style={[styles.indicadorValor, { color: cor }]}>{valor}</Text>
    </View>
  );
}

// Botão de ação rápida
function BotaoAcao({ texto }: { texto: string }) {
  return (
    <TouchableOpacity style={styles.acaoRapida} activeOpacity={0.7}>
      <Text style={styles.acaoRapidaTexto}>{texto}</Text>
    </TouchableOpacity>
  );
}

export default function InicioScreen() {
  const [dados, setDados] = useState<DashboardResposta | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      setErro(null);
      const resposta = await buscarDashboard();
      setDados(resposta);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  // Recarrega sempre que a tela ganha foco
  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView
        contentContainerStyle={styles.conteudo}
        refreshControl={
          <RefreshControl refreshing={carregando} onRefresh={carregar} />
        }
      >
        <Text style={styles.tituloSecao}>Visão geral</Text>
        <Text style={styles.subtitulo}>
          Acompanhe os principais registros da qualidade
        </Text>

        {carregando && !dados ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginTop: 24 }}
          />
        ) : erro ? (
          <Text style={styles.erro}>{erro}</Text>
        ) : dados ? (
          <>
            {/* Indicadores */}
            <View style={styles.grid}>
              <CartaoIndicador
                titulo="OPs em andamento"
                valor={dados.overview.opsEmAndamento}
                cor={colors.primary}
              />
              <CartaoIndicador
                titulo="Ocorrências abertas"
                valor={dados.overview.ocorrenciasAbertas}
                cor="#9A6700"
              />
            </View>
            <View style={styles.grid}>
              <CartaoIndicador
                titulo="Ações atrasadas"
                valor={dados.overview.acoesAtrasadas}
                cor="#C53030"
              />
              <CartaoIndicador
                titulo="Aguardando avaliação"
                valor={dados.overview.aguardandoAvaliacao}
                cor="#5B4BC4"
              />
            </View>

            {/* Ações rápidas */}
            <Text style={styles.tituloSecao}>Ações rápidas</Text>
            <View style={styles.grid}>
              <BotaoAcao texto="+ Nova OP" />
              <BotaoAcao texto="+ Nova ocorrência" />
            </View>
            <View style={styles.grid}>
              <BotaoAcao texto="+ Novo recebimento" />
              <BotaoAcao texto="+ Nova ação corretiva" />
            </View>

            {/* Registros recentes */}
            <Text style={styles.tituloSecao}>Registros recentes</Text>
            {dados.recentes.map((r) => (
              <View key={r.id} style={styles.recente}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.recenteTipo}>
                    {r.tipo === 'op'
                      ? 'Ordem de Produção'
                      : r.tipo === 'ocorrencia'
                      ? 'Ocorrência'
                      : r.tipo === 'acao'
                      ? 'Ação Corretiva'
                      : 'Recebimento'}
                  </Text>
                  <Text style={styles.recenteCodigo}>{r.codigo}</Text>
                </View>
                <StatusBadge status={r.status} />
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.screenBg },
  conteudo: { padding: 16, paddingBottom: 32 },
  tituloSecao: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 18,
    marginBottom: 4,
  },
  subtitulo: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  indicador: {
    flex: 1,
    backgroundColor: colors.cardBg,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  indicadorTitulo: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  indicadorValor: {
    fontSize: 28,
    fontWeight: '800',
  },
  acaoRapida: {
    flex: 1,
    backgroundColor: colors.cardBg,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  acaoRapidaTexto: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  recente: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardBg,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recenteTipo: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  recenteCodigo: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  erro: {
    color: colors.danger,
    fontSize: 14,
    marginTop: 20,
    textAlign: 'center',
  },
});
