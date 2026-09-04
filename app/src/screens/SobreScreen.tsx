import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/Header';
import { colors } from '../theme/colors';

export default function SobreScreen() {
  const navigation = useNavigation<any>();
  const [modalPrivacidadeVisivel, setModalPrivacidadeVisivel] = useState(false);
  const [modalTermosVisivel, setModalTermosVisivel] = useState(false);

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Cabeçalho da Tela */}
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.botaoVoltar}>
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.tituloTela}>Sobre o aplicativo</Text>
            <Text style={styles.subtituloTela}>Informações institucionais e documentos</Text>
          </View>
        </View>

        {/* Logo e Nome */}
        <View style={styles.containerLogo}>
          <View style={styles.avatarLogo}>
            <Text style={styles.avatarLogoTexto}>GS</Text>
          </View>
          <Text style={styles.nomeApp}>Gestão da Qualidade</Text>
          <Text style={styles.empresaApp}>Grupo Setti</Text>
          <Text style={styles.versaoApp}>Versão 1.0.0</Text>
        </View>

        {/* Seção Sobre */}
        <Text style={styles.secaoTitulo}>Sobre</Text>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTituloDestaque}>Apoio à Gestão da Qualidade</Text>
          <Text style={styles.cardTexto}>
            Aplicativo para registrar e acompanhar ordens de produção, recebimentos, ocorrências e ações corretivas.
          </Text>
        </View>

        {/* Informações do aplicativo */}
        <Text style={styles.secaoTitulo}>Informações do aplicativo</Text>
        <View style={styles.cardTabela}>
          <View style={styles.linhaTabela}>
            <Text style={styles.tabelaLabel}>Versão</Text>
            <Text style={styles.tabelaValor}>1.0.0</Text>
          </View>
          <View style={styles.divisor} />
          <View style={styles.linhaTabela}>
            <Text style={styles.tabelaLabel}>Desenvolvido para</Text>
            <Text style={styles.tabelaValor}>Grupo Setti</Text>
          </View>
          <View style={styles.divisor} />
          <View style={styles.linhaTabela}>
            <Text style={styles.tabelaLabel}>Tecnologia</Text>
            <Text style={styles.tabelaValor}>React Native</Text>
          </View>
        </View>

        {/* Documentos */}
        <Text style={styles.secaoTitulo}>Documentos</Text>
        <TouchableOpacity 
          style={styles.botaoDocumento} 
          activeOpacity={0.7}
          onPress={() => setModalPrivacidadeVisivel(true)}
        >
          <Text style={styles.botaoDocumentoTexto}>Política de privacidade</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.botaoDocumento} 
          activeOpacity={0.7}
          onPress={() => setModalTermosVisivel(true)}
        >
          <Text style={styles.botaoDocumentoTexto}>Termos de uso</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Rodapé */}
        <Text style={styles.rodape}>© 2026 Grupo Setti</Text>

      </ScrollView>

      {/* Modal Política de Privacidade */}
      <Modal visible={modalPrivacidadeVisivel} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Política de privacidade</Text>
              <TouchableOpacity onPress={() => setModalPrivacidadeVisivel(false)}>
                <Ionicons name="close" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalSecaoTitulo}>Resumo</Text>
              <Text style={styles.modalTexto}>Este resumo explica como o aplicativo utiliza informações nos processos de Gestão da Qualidade.</Text>
              
              <Text style={styles.modalSecaoTitulo}>Dados utilizados</Text>
              <Text style={styles.modalTexto}>Podem ser registrados nome, e-mail, setor, perfil de acesso, registros de produção, fotos e documentos.</Text>
              
              <Text style={styles.modalSecaoTitulo}>Finalidade</Text>
              <Text style={styles.modalTexto}>As informações são utilizadas para controlar acessos, manter a rastreabilidade, acompanhar registros e gerar indicadores.</Text>
              
              <Text style={styles.modalSecaoTitulo}>Acesso</Text>
              <Text style={styles.modalTexto}>Somente usuários autorizados podem consultar os dados, conforme seu perfil e suas permissões.</Text>
              
              <Text style={styles.modalSecaoTitulo}>Responsabilidades</Text>
              <Text style={styles.modalTexto}>O usuário deve proteger sua senha e registrar informações corretas no aplicativo.</Text>
              
              <Text style={styles.modalSecaoTitulo}>Contato</Text>
              <Text style={styles.modalTexto}>Dúvidas ou solicitações podem ser encaminhadas pelo canal de suporte.</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Termos de Uso */}
      <Modal visible={modalTermosVisivel} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Termos de uso</Text>
              <TouchableOpacity onPress={() => setModalTermosVisivel(false)}>
                <Ionicons name="close" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalSecaoTitulo}>Resumo</Text>
              <Text style={styles.modalTexto}>Estes termos apresentam as regras básicas para utilização do aplicativo de Gestão da Qualidade da Grupo Setti.</Text>
              
              <Text style={styles.modalSecaoTitulo}>Uso permitido</Text>
              <Text style={styles.modalTexto}>O aplicativo deve ser utilizado somente por usuários autorizados e para atividades profissionais relacionadas à empresa.</Text>
              
              <Text style={styles.modalSecaoTitulo}>Conta de acesso</Text>
              <Text style={styles.modalTexto}>A conta é individual. O usuário não deve compartilhar sua senha ou permitir que outras pessoas utilizem seu acesso.</Text>
              
              <Text style={styles.modalSecaoTitulo}>Responsabilidades</Text>
              <Text style={styles.modalTexto}>O usuário deve registrar informações corretas, preservar a confidencialidade dos dados e utilizar as funcionalidades de maneira responsável.</Text>
              
              <Text style={styles.modalSecaoTitulo}>Não é permitido</Text>
              <Text style={styles.modalTexto}>É proibido acessar informações sem autorização, alterar registros indevidamente ou utilizar o aplicativo para finalidades diferentes das previstas.</Text>
              
              <Text style={styles.modalSecaoTitulo}>Registros</Text>
              <Text style={styles.modalTexto}>As ações realizadas no aplicativo poderão ser registradas para garantir rastreabilidade, segurança e acompanhamento dos processos.</Text>
              
              <Text style={styles.modalSecaoTitulo}>Atualizações</Text>
              <Text style={styles.modalTexto}>Estos termos poderão ser atualizados conforme as necessidades da empresa e do aplicativo.</Text>
              
              <Text style={styles.modalSecaoTitulo}>Contato</Text>
              <Text style={styles.modalTexto}>Em caso de dúvida, entre em contato pelo canal de suporte.</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.screenBg },
  content: { padding: 16, paddingBottom: 40 },
  subHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  botaoVoltar: { marginRight: 12 },
  tituloTela: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
  subtituloTela: { fontSize: 12, color: colors.textSecondary },
  containerLogo: { alignItems: 'center', marginBottom: 24, marginTop: 8 },
  avatarLogo: { width: 64, height: 64, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  avatarLogoTexto: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  nomeApp: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
  empresaApp: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  versaoApp: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  secaoTitulo: { fontSize: 13, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 8, marginTop: 16 },
  cardInfo: { backgroundColor: '#FFF', borderRadius: 8, padding: 14, borderWidth: 1, borderColor: colors.border },
  cardTituloDestaque: { fontSize: 13, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 4 },
  cardTexto: { fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  cardTabela: { backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  linhaTabela: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12 },
  tabelaLabel: { fontSize: 13, color: colors.textSecondary },
  tabelaValor: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  divisor: { height: 1, backgroundColor: colors.border },
  botaoDocumento: { backgroundColor: '#FFF', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: colors.border, marginBottom: 8 },
  botaoDocumentoTexto: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  rodape: { textAlign: 'center', fontSize: 11, color: colors.textSecondary, marginTop: 30 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16 },
  modalContainer: { backgroundColor: '#FFF', borderRadius: 12, maxHeight: '80%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 10 },
  modalTitulo: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
  modalScroll: { maxHeight: 400 },
  modalSecaoTitulo: { fontSize: 13, fontWeight: 'bold', color: colors.textPrimary, marginTop: 12, marginBottom: 4 },
  modalTexto: { fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
});