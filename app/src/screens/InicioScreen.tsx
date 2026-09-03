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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import Header from '../components/Header';
import StatusBadge from '../components/StatusBadge';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { buscarDashboard, DashboardResposta } from '../services/api';
import { alertar } from '../utils/alerta';
import { abrirDetalhe, temTelaDeDetalhe } from '../navigation/navegarDetalhe';

const rotuloTipo: Record<string, string> = {
  op: 'Ordem de Produção',
  ocorrencia: 'Ocorrência',
  acao: 'Ação Corretiva',
  recebimento: 'Recebimento',
};

const iconeTipo: Record<string, keyof typeof Ionicons.glyphMap> = {
  op: 'document-text',
  ocorrencia: 'warning',
  acao: 'construct',
  recebimento: 'cube',
};

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
      <Text style={[styles.indicadorValor, { color: cor }]}>{valor}</Text>
      <Text style={styles.indicadorTitulo}>{titulo}</Text>
    </View>
  );
}

// Gera as iniciais a partir do nome (ex.: "Carlos Silva" -> "CS")
function iniciais(nome: string) {
  const partes = nome.trim().split(' ');
  const primeira = partes[0]?.[0] ?? '';
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeira + ultima).toUpperCase();
}

// Botão de ação rápida (ícone + rótulo)
function BotaoAcao({
  icone,
  texto,
  cor,
  fundo,
  onPress,
}: {
  icone: keyof typeof Ionicons.glyphMap;
  texto: string;
  cor: string;
  fundo: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.acaoRapida} activeOpacity={0.7} onPress={onPress}>
      <View style={[styles.acaoRapidaIcone, { backgroundColor: fundo }]}>
        <Ionicons name={icone} size={16} color={cor} />
      </View>
      <Text style={styles.acaoRapidaTexto}>{texto}</Text>
    </TouchableOpacity>
  );
}

export default function InicioScreen() {
  const navigation = useNavigation<any>();
  const { usuario } = useAuth();
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

  const emBreve = () =>
    alertar('Em breve', 'Esta tela será desenvolvida nas próximas etapas.');

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView
        contentContainerStyle={styles.conteudo}
        refreshControl={
          <RefreshControl refreshing={carregando} onRefresh={carregar} />
        }
      >
        {/* Boas-vindas */}
        <View style={styles.boasVindas}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTexto}>
              {usuario ? iniciais(usuario.nome) : '?'}
            </Text>
          </View>
          <View>
            <Text style={styles.boasVindasSaudacao}>Bem-vindo,</Text>
            <Text style={styles.boasVindasNome}>
              {usuario?.nome} — {usuario?.cargo}
            </Text>
          </View>
        </View>

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
              <BotaoAcao
                icone="document-text"
                texto="Nova OP"
                cor={colors.primary}
                fundo="#DCEBF7"
                onPress={() => navigation.navigate('NovaOp')}
              />
              <BotaoAcao
                icone="warning"
                texto="Nova ocorrência"
                cor="#C53030"
                fundo="#FBD5D5"
                onPress={() => navigation.navigate('NovaOcorrencia')}
              />
            </View>
            <View style={styles.grid}>
              <BotaoAcao
                icone="cube"
                texto="Novo recebimento"
                cor="#1F9D57"
                fundo="#D7F5DD"
                onPress={() => navigation.navigate('NovoRecebimento')}
              />
              <BotaoAcao
                icone="construct"
                texto="Nova ação corretiva"
                cor="#9A6700"
                fundo="#FDECC8"
                onPress={() => navigation.navigate('NovaAcaoCorretiva', {})}
              />
            </View>

            {/* Registros recentes */}
            <Text style={styles.tituloSecao}>Registros recentes</Text>
            {dados.recentes.map((r) => {
              const tocavel = temTelaDeDetalhe(r.tipo);
              return (
                <TouchableOpacity
                  key={r.id}
                  style={styles.recente}
                  activeOpacity={tocavel ? 0.7 : 1}
                  disabled={!tocavel}
                  onPress={() => abrirDetalhe(navigation, r)}
                >
                  <Ionicons
                    name={iconeTipo[r.tipo]}
                    size={20}
                    color={colors.textSecondary}
                    style={styles.recenteIcone}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recenteTitulo} numberOfLines={1}>
                      {r.titulo || rotuloTipo[r.tipo]}
                    </Text>
                    <Text style={styles.recenteCodigo}>
                      {r.codigo} · {r.data}
                    </Text>
                  </View>
                  <StatusBadge status={r.status} />
                  {tocavel && (
                    <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.screenBg },
  conteudo: { padding: 16, paddingBottom: 32 },
  boasVindas: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarTexto: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
  boasVindasSaudacao: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  boasVindasNome: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
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
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  indicadorTitulo: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  indicadorValor: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  acaoRapida: {
    flex: 1,
    backgroundColor: colors.cardBg,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  acaoRapidaIcone: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  acaoRapidaTexto: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  recente: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.cardBg,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recenteIcone: {
    marginTop: 2,
  },
  recenteTitulo: {
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
