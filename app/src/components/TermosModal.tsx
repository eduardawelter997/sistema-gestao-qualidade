/**
 * Modal com o texto dos Termos de Uso e Política de Privacidade,
 * usado na tela "Primeiro acesso".
 */
import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '../theme/colors';

const SECOES = [
  {
    titulo: 'Resumo',
    texto:
      'Este documento apresenta as regras de uso do aplicativo e explica como são tratados os dados utilizados na Gestão da Qualidade do Grupo Setti.',
  },
  {
    titulo: 'Acesso e uso',
    texto:
      'O aplicativo deve ser utilizado somente por profissionais autorizados. A conta é individual, e o usuário deve manter sua senha protegida e registrar informações corretas.',
  },
  {
    titulo: 'Dados utilizados',
    texto:
      'Poderão ser tratados nome, e-mail, setor, perfil de acesso, ordens de produção, recebimentos, ocorrências, ações corretivas, fotos e documentos.',
  },
  {
    titulo: 'Finalidade',
    texto:
      'Os dados são utilizados para controlar acessos, organizar evidências, garantir a rastreabilidade dos processos, acompanhar registros e gerar indicadores gerenciais.',
  },
  {
    titulo: 'Proteção e acesso',
    texto:
      'As informações serão acessadas somente por usuários autorizados, de acordo com as permissões de cada perfil. Devem ser adotadas medidas para evitar acessos, alterações ou exclusões indevidas.',
  },
  {
    titulo: 'Responsabilidades',
    texto:
      'O usuário deve preservar a confidencialidade das informações e utilizar o aplicativo apenas para as atividades profissionais previstas. As ações realizadas poderão ser registradas para garantir segurança e rastreabilidade.',
  },
  {
    titulo: 'Armazenamento',
    texto:
      'Os dados serão mantidos pelo período necessário às atividades da empresa e às obrigações aplicáveis, podendo ser corrigidos ou removidos quando permitido.',
  },
  {
    titulo: 'Aceite e atualizações',
    texto:
      'Ao marcar a opção de aceite, o usuário declara que leu e concorda com estes termos e com o tratamento de dados descrito. Este documento poderá ser atualizado quando necessário.',
  },
  {
    titulo: 'Contato',
    texto: 'Em caso de dúvida, o usuário deve utilizar o canal de suporte disponibilizado no aplicativo.',
  },
];

export default function TermosModal({
  visivel,
  aoFechar,
}: {
  visivel: boolean;
  aoFechar: () => void;
}) {
  return (
    <Modal visible={visivel} animationType="slide" transparent onRequestClose={aoFechar}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.titulo}>Termos de uso e a Política de Privacidade</Text>
            <TouchableOpacity onPress={aoFechar} hitSlop={8}>
              <Text style={styles.fechar}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 16 }}>
            {SECOES.map((secao) => (
              <View key={secao.titulo} style={styles.secao}>
                <Text style={styles.secaoTitulo}>{secao.titulo}</Text>
                <Text style={styles.secaoTexto}>{secao.texto}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titulo: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 12,
  },
  fechar: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  scroll: {
    marginTop: 4,
  },
  secao: {
    marginBottom: 14,
  },
  secaoTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  secaoTexto: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
});
