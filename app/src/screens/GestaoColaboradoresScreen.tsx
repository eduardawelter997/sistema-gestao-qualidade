import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../components/Header';
import { colors } from '../theme/colors';
import { API_URL } from '../config/api';

export default function GestaoColaboradoresScreen() {
  const navigation = useNavigation<any>();
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Função para buscar os colaboradores cadastrados na API
  const buscarColaboradores = async () => {
    try {
      setCarregando(true);
      const token = await AsyncStorage.getItem('@gestao_qualidade:token');

      const resposta = await fetch(`${API_URL}/api/auth/colaboradores`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        setColaboradores(dados.colaboradores || []);
      } else {
        Alert.alert('Erro', dados.erro || 'Não foi possível carregar os colaboradores.');
      }
    } catch (error) {
      console.log('Erro ao buscar colaboradores:', error);
      Alert.alert('Erro', 'Falha na conexão com o servidor.');
    } finally {
      setCarregando(false);
    }
  };

  // Atualiza a lista toda vez que a tela ganha foco (ex: volta da tela de cadastro)
  useFocusEffect(
    useCallback(() => {
      buscarColaboradores();
    }, [])
  );

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Subcabeçalho com botão voltar */}
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.botaoVoltar}>
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.tituloTela}>Gestão de colaboradores</Text>
            <Text style={styles.subtituloTela}>Gerencie os acessos e equipes do sistema</Text>
          </View>
        </View>

        {/* Botão de Convidar / Cadastrar Novo Acesso */}
        <TouchableOpacity
          style={styles.botaoConvidar}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('ConvidarColaborador')}
        >
          <Ionicons name="person-add" size={18} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.botaoConvidarTexto}>Cadastrar novo acesso</Text>
        </TouchableOpacity>

        <Text style={styles.secaoTitulo}>Colaboradores cadastrados</Text>

        {carregando ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
        ) : colaboradores.length === 0 ? (
          <Text style={styles.vazioTexto}>Nenhum colaborador cadastrado ainda.</Text>
        ) : (
          colaboradores.map((colaborador) => {
            // Gera as iniciais do nome (ex: "Carlos Silva" -> "CS")
            const iniciais = colaborador.nome
              ? colaborador.nome.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
              : 'US';

            const isInativo = colaborador.status === 'Inativo'; // 👈 Identifica se está inativo

            return (
              <View key={colaborador.id} style={styles.cardColaborador}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarTexto}>{iniciais}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.nomeColaborador}>{colaborador.nome}</Text>
                  <Text style={styles.emailColaborador}>{colaborador.email}</Text>
                  <Text style={styles.detalhesColaborador}>
                    {colaborador.perfil} | Setor: {colaborador.setor}
                  </Text>
                </View>

                {/* Lado direito: Status dinâmico e opções */}
                <View style={styles.direitaCard}>
                  <View style={[
                    styles.statusBadge,
                    isInativo && styles.statusBadgeInativo
                  ]}>
                    <Text style={[
                      styles.statusTexto,
                      isInativo && styles.statusTextoInativo
                    ]}>
                      {colaborador.status || 'Ativo'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => navigation.navigate('DetalhesColaborador', { colaborador })}
                    style={styles.botaoOpcoes}
                  >
                    <Ionicons name="ellipsis-vertical" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.screenBg,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  botaoVoltar: {
    marginRight: 12,
  },
  tituloTela: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  subtituloTela: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  botaoConvidar: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginBottom: 20,
  },
  botaoConvidarTexto: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secaoTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  vazioTexto: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 20,
    fontSize: 14,
  },
  cardColaborador: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarTexto: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  nomeColaborador: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emailColaborador: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  detalhesColaborador: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  direitaCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  statusTexto: {
    color: '#137333',
    fontSize: 11,
    fontWeight: 'bold',
  },
  botaoOpcoes: {
    padding: 4,
  },

  statusBadgeInativo: {
    backgroundColor: '#FCE8E6', // Fundo vermelho clarinho para inativo
  },
  statusTextoInativo: {
    color: '#C5221F', // Texto vermelho escuro para inativo
  },
});
