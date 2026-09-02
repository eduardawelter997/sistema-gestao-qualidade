/**
 * Tela Mais.
 * Mostra o perfil do usuário logado e os menus de Gestão e Outros.
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Header from '../components/Header';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { alertar, confirmar } from '../utils/alerta';

// Gera as iniciais a partir do nome (ex.: "Carlos Silva" -> "CS")
function iniciais(nome: string) {
  const partes = nome.trim().split(' ');
  const primeira = partes[0]?.[0] ?? '';
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeira + ultima).toUpperCase();
}

// Item de menu com seta
function ItemMenu({
  texto,
  cor,
  onPress,
}: {
  texto: string;
  cor?: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.7}>
      <Text style={[styles.itemTexto, cor ? { color: cor } : null]}>{texto}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

export default function MaisScreen() {
  const { usuario, sair } = useAuth();

  const emBreve = () =>
    alertar('Em breve', 'Esta tela será desenvolvida nas próximas etapas.');

  function confirmarSaida() {
    confirmar('Sair', 'Deseja realmente sair do aplicativo?', () => sair(), 'Sair');
  }

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.conteudo}>
        <Text style={styles.tituloMais}>Mais</Text>

        {/* Cartão de perfil */}
        <TouchableOpacity style={styles.perfil} onPress={emBreve} activeOpacity={0.7}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTexto}>
              {usuario ? iniciais(usuario.nome) : '?'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.perfilNome}>{usuario?.nome}</Text>
            <Text style={styles.perfilCargo}>{usuario?.cargo}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Gestão */}
        <Text style={styles.secao}>Gestão</Text>
        <View style={styles.grupo}>
          <ItemMenu texto="Gestão de funcionários" onPress={emBreve} />
          <ItemMenu texto="Indicadores gerenciais" onPress={emBreve} />
          <ItemMenu texto="Cliente e fornecedores" onPress={emBreve} />
        </View>

        {/* Outros */}
        <Text style={styles.secao}>Outros</Text>
        <View style={styles.grupo}>
          <ItemMenu texto="Ajuda e suporte" onPress={emBreve} />
          <ItemMenu texto="Sobre o aplicativo" onPress={emBreve} />
          <ItemMenu
            texto="Sair do aplicativo"
            cor={colors.danger}
            onPress={confirmarSaida}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.screenBg },
  conteudo: { padding: 16, paddingBottom: 32 },
  tituloMais: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 12,
  },
  perfil: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
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
  perfilNome: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  perfilCargo: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  secao: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 22,
    marginBottom: 8,
  },
  grupo: {
    backgroundColor: colors.cardBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  itemTexto: {
    fontSize: 15,
    color: colors.textPrimary,
  },
});
