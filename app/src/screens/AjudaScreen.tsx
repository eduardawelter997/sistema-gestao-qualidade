import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/Header';
import { colors } from '../theme/colors';

// Lista de dúvidas frequentes com seus conteúdos
const duvidasFrequentes = [
  {
    id: '1',
    titulo: 'Como registrar uma ocorrência?',
    conteudo: [
      '1. Acesse a opção "Nova ocorrência".',
      '2. Selecione o tipo da ocorrência.',
      '3. Informe a OP relacionada, se houver.',
      '4. Selecione o cliente ou fornecedor, se necessário.',
      '5. Escolha o setor ou processo e o responsável.',
      '6. Informe a data, descreva o problema e adicione as evidências.',
      '7. Toque em "Salvar ocorrência".',
    ],
  },
  {
    id: '2',
    titulo: 'Como vincular uma OP?',
    conteudo: [
      '1. Abra o formulário do registro que deseja criar.',
      '2. Localize o campo "OP relacionada".',
      '3. Toque no campo para abrir a lista de opções.',
      '4. Selecione a ordem de produção desejada.',
      '5. Confira se o número da OP está correto.',
      '6. Preencha os demais dados do formulário.',
      '7. Toque no botão de salvar para concluir.',
      'Caso não exista uma OP relacionada, selecione "Nenhuma" ou deixe o campo vazio quando ele for opcional.',
    ],
  },
  {
    id: '3',
    titulo: 'Como criar uma ação corretiva?',
    conteudo: [
      '1. Abra os detalhes da ocorrência.',
      '2. Toque em "Criar ação corretiva".',
      '3. Selecione a origem e o método de análise.',
      '4. Informe a ocorrência e o cliente ou fornecedor, se necessário.',
      '5. Selecione o responsável e o setor responsável.',
      '6. Defina o prazo para conclusão.',
      '7. Descreva a causa identificada e a ação proposta.',
      '8. Adicione as evidências e toque em "Salvar ação corretiva".',
    ],
  },
  {
    id: '4',
    titulo: 'Como adicionar fotos e documentos?',
    conteudo: [
      '1. Abra o registro ao qual deseja adicionar uma evidência.',
      '2. Toque em "Adicionar foto ou documento".',
      '3. Escolha entre tirar uma foto, selecionar uma imagem ou procurar um documento.',
      '4. Selecione ou capture o arquivo desejado.',
      '5. Confira se o arquivo apareceu na área de anexos.',
      '6. Toque no botão de salvar para concluir.',
      'Formatos permitidos: JPG, JPEG, PNG e PDF.',
      'Antes de salvar, verifique se a imagem está legível e se o documento pertence ao registro correto.',
    ],
  },
];

export default function AjudaScreen() {
  const navigation = useNavigation<any>();
  const [busca, setBusca] = useState('');
  const [duvidaSelecionada, setDuvidaSelecionada] = useState<any>(null);

  // Filtra as dúvidas conforme o usuário digita na barra de busca
  const duvidasFiltradas = duvidasFrequentes.filter((item) =>
    item.titulo.toLowerCase().includes(busca.toLowerCase())
  );

  const handleContatoSuporte = () => {
    // Exemplo abrindo e-mail de suporte ou WhatsApp/Telefone
    const email = 'suporte@gruposetti.com.br';
    const assunto = 'Suporte - Aplicativo Gestão da Qualidade';
    Linking.openURL(`mailto:${email}?subject=${encodeURIComponent(assunto)}`).catch(() => {
      Alert.alert('Contato', 'Envie um e-mail para: suporte@gruposetti.com.br');
    });
  };

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Cabeçalho */}
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.botaoVoltar}>
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.tituloTela}>Ajuda e suporte</Text>
            <Text style={styles.subtituloTela}>Encontre respostas rápidas ou fale com o suporte</Text>
          </View>
        </View>

        {/* Título de destaque e barra de busca */}
        <Text style={styles.tituloSecaoDestaque}>Como podemos ajudar?</Text>
        <Text style={styles.subtituloBusca}>Encontre respostas rápidas ou fale com o suporte.</Text>

        <View style={styles.containerBusca}>
          <Ionicons name="search" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.inputBusca}
            placeholder="Busque uma dúvida ou assunto..."
            placeholderTextColor={colors.textSecondary}
            value={busca}
            onChangeText={setBusca}
          />
        </View>

        {/* Lista de Dúvidas Frequentes */}
        <Text style={styles.tituloSecao}>Dúvidas frequentes</Text>

        {duvidasFiltradas.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.cardDuvida}
            activeOpacity={0.7}
            onPress={() => setDuvidaSelecionada(item)}
          >
            <Text style={styles.textoDuvida}>{item.titulo}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        ))}

        {duvidasFiltradas.length === 0 && (
          <Text style={styles.nenhumResultado}>Nenhuma dúvida encontrada.</Text>
        )}

        {/* Fale com o suporte */}
        <Text style={styles.tituloSecao}>Fale com o suporte</Text>
        <View style={styles.cardSuporte}>
          <Text style={styles.suporteTitulo}>Ainda precisa de ajuda?</Text>
          <Text style={styles.suporteTexto}>Entre em contato com a equipe responsável pelo aplicativo.</Text>
          
          <TouchableOpacity 
            style={styles.botaoSuporte} 
            activeOpacity={0.8}
            onPress={handleContatoSuporte}
          >
            <Text style={styles.botaoSuporteTexto}>Enviar mensagem ao suporte</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Modal Passo a Passo */}
      <Modal visible={!!duvidaSelecionada} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>{duvidaSelecionada?.titulo}</Text>
              <TouchableOpacity onPress={() => setDuvidaSelecionada(null)}>
                <Ionicons name="close" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalPassoAPasso}>Passo a passo:</Text>
              {duvidaSelecionada?.conteudo.map((passo: string, index: number) => (
                <Text key={index} style={styles.modalTextoPasso}>{passo}</Text>
              ))}
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
  tituloSecaoDestaque: { fontSize: 15, fontWeight: 'bold', color: colors.textPrimary },
  subtituloBusca: { fontSize: 12, color: colors.textSecondary, marginBottom: 12 },
  containerBusca: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, height: 46, marginBottom: 20 },
  inputBusca: { flex: 1, fontSize: 14, color: colors.textPrimary },
  tituloSecao: { fontSize: 13, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 8, marginTop: 8 },
  cardDuvida: { backgroundColor: '#FFF', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: colors.border, marginBottom: 8 },
  textoDuvida: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  nenhumResultado: { textAlign: 'center', fontSize: 12, color: colors.textSecondary, marginVertical: 12 },
  cardSuporte: { backgroundColor: '#FFF', borderRadius: 8, padding: 16, borderWidth: 1, borderColor: colors.border, marginTop: 4 },
  suporteTitulo: { fontSize: 13, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 4 },
  suporteTexto: { fontSize: 12, color: colors.textSecondary, marginBottom: 16, lineHeight: 18 },
  botaoSuporte: { backgroundColor: colors.primary, borderRadius: 8, alignItems: 'center', paddingVertical: 12 },
  botaoSuporteTexto: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16 },
  modalContainer: { backgroundColor: '#FFF', borderRadius: 12, maxHeight: '80%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 10 },
  modalTitulo: { fontSize: 15, fontWeight: 'bold', color: colors.primary, flex: 1, marginRight: 8 },
  modalScroll: { maxHeight: 400 },
  modalPassoAPasso: { fontSize: 13, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 8 },
  modalTextoPasso: { fontSize: 13, color: colors.textSecondary, marginBottom: 8, lineHeight: 18 },
});