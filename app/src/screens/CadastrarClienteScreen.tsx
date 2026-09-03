import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { criarRegistro } from '../services/api';
import { alertar } from '../utils/alerta';

export default function CadastrarClienteScreen() {
  const navigation = useNavigation<any>();

  //  Funções utilitárias (máscaras e validações) ficam aqui em cima
  const aplicarMascaraCpfCnpj = (texto: string) => {
    const apenasNumeros = texto.replace(/\D/g, '').slice(0, 14);

    if (apenasNumeros.length <= 11) {
      let cpf = apenasNumeros;
      if (cpf.length > 9) {
        return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
      }
      if (cpf.length > 6) {
        return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6)}`;
      }
      if (cpf.length > 3) {
        return `${cpf.slice(0, 3)}.${cpf.slice(3)}`;
      }
      return cpf;
    }

    let cnpj = apenasNumeros;
    if (cnpj.length > 12) {
      return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`;
    }
    if (cnpj.length > 8) {
      return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8)}`;
    }
    if (cnpj.length > 5) {
      return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5)}`;
    }
    if (cnpj.length > 2) {
      return `${cnpj.slice(0, 2)}.${cnpj.slice(2)}`;
    }
    return cnpj;
  };

  const aplicarMascaraTelefone = (texto: string) => {
    const apenasNumeros = texto.replace(/\D/g, '').slice(0, 11);

    if (apenasNumeros.length > 10) {
      return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 7)}-${apenasNumeros.slice(7)}`;
    }
    if (apenasNumeros.length > 6) {
      return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 6)}-${apenasNumeros.slice(6)}`;
    }
    if (apenasNumeros.length > 2) {
      return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2)}`;
    }
    if (apenasNumeros.length > 0) {
      return `(${apenasNumeros}`;
    }
    return apenasNumeros;
  };

  const validarEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // Estados do formulário
  const [tipoCadastro, setTipoCadastro] = useState<'cliente' | 'fornecedor'>('cliente');
  const [nome, setNome] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Função de salvar
  const handleSalvarCadastro = async () => {
    if (!nome || !cpfCnpj) {
      alertar('Atenção', 'Por favor, preencha os campos obrigatórios.');
      return;
    }

    try {
      await criarRegistro({
        tipo: tipoCadastro,
        titulo: nome,
        descricao: `CPF/CNPJ: ${cpfCnpj} | E-mail: ${email} | Tel: ${telefone} | Obs: ${observacoes}`,
      });

      alertar('Sucesso', 'Cadastro realizado com sucesso no banco!');
      navigation.goBack();
    } catch (error: any) {
      alertar('Erro', error.message || 'Não foi possível conectar ao servidor.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Topo Azul com o nome do Grupo e ícone de saída */}
      <View style={styles.topBar}>
        <Text style={styles.topBarText}>GRUPO SETTI</Text>
        <Ionicons name="exit-outline" size={20} color="#FFF" />
      </View>

      {/* Cabeçalho com botão de voltar funcional */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.botaoVoltar}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitulo}>Clientes e fornecedores</Text>
          <Text style={styles.headerSubtitulo}>Cadastre dados básicos para rastreabilidade</Text>
        </View>
      </View>

      {/* Formulário */}
      <ScrollView contentContainerStyle={styles.formulario}>
        
        {/* Tipo de cadastro */}
        <Text style={styles.label}>Tipo de cadastro:</Text>
        <View style={styles.linhaTipo}>
          <TouchableOpacity
            style={[
              styles.botaoTipo,
              tipoCadastro === 'cliente' ? styles.botaoTipoAtivo : styles.botaoTipoInativo,
            ]}
            activeOpacity={0.8}
            onPress={() => setTipoCadastro('cliente')}
          >
            <Text
              style={[
                styles.textoTipo,
                tipoCadastro === 'cliente' ? styles.textoTipoAtivo : styles.textoTipoInativo,
              ]}
            >
              Cliente
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.botaoTipo,
              tipoCadastro === 'fornecedor' ? styles.botaoTipoAtivo : styles.botaoTipoInativo,
            ]}
            activeOpacity={0.8}
            onPress={() => setTipoCadastro('fornecedor')}
          >
            <Text
              style={[
                styles.textoTipo,
                tipoCadastro === 'fornecedor' ? styles.textoTipoAtivo : styles.textoTipoInativo,
              ]}
            >
              Fornecedor
            </Text>
          </TouchableOpacity>
        </View>

        {/* Nome / Razão social */}
        <Text style={styles.label}>Nome/Razão social: <Text style={styles.obrigatorio}>*</Text></Text>
        <TextInput
          placeholder="Digite o nome ou razão social"
          placeholderTextColor={colors.textSecondary}
          value={nome}
          onChangeText={setNome}
          style={styles.inputCaixa}
        />

        {/* CPF / CNPJ */}
        <Text style={styles.label}>CPF/CNPJ: <Text style={styles.obrigatorio}>*</Text></Text>
        <TextInput
          placeholder="Digite o CPF ou CNPJ"
          placeholderTextColor={colors.textSecondary}
          value={cpfCnpj}
          onChangeText={(texto) => {
            const valorComMascara = aplicarMascaraCpfCnpj(texto);
            setCpfCnpj(valorComMascara);
          }}
          keyboardType="numeric"
          style={styles.inputCaixa}
        />

        {/* E-mail */}
        <Text style={styles.label}>E-mail:</Text>
        <TextInput
          placeholder="Digite o e-mail"
          placeholderTextColor={colors.textSecondary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.inputCaixa}
        />

        {/* Telefone */}
        <Text style={styles.label}>Telefone:</Text>
        <TextInput
          placeholder="Digite o telefone"
          placeholderTextColor={colors.textSecondary}
          value={telefone}
          onChangeText={(texto) => {
            const valorComMascara = aplicarMascaraTelefone(texto);
            setTelefone(valorComMascara);
          }}
          keyboardType="phone-pad"
          style={styles.inputCaixa}
        />

        {/* Observações */}
        <Text style={styles.label}>Observações:</Text>
        <TextInput
          placeholder="Adicione uma observação, se necessário"
          placeholderTextColor={colors.textSecondary}
          value={observacoes}
          onChangeText={setObservacoes}
          multiline
          style={styles.inputAreaTexto}
        />

        {/* Botão Salvar cadastro */}
        <TouchableOpacity 
          style={styles.botaoSalvar} 
          activeOpacity={0.8} 
          onPress={handleSalvarCadastro}
        >
          <Text style={styles.botaoSalvarTexto}>Salvar cadastro</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.screenBg 
  },
  topBar: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 12,
  },
  topBarText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.screenBg,
  },
  botaoVoltar: {
    marginRight: 12,
  },
  headerTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  headerSubtitulo: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  formulario: {
    padding: 16,
    paddingBottom: 40,
  },
  obrigatorio: {
    color: colors.danger,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
    marginTop: 10,
  },
  linhaTipo: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 6,
  },
  botaoTipo: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  botaoTipoAtivo: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  botaoTipoInativo: {
    backgroundColor: '#FFF',
    borderColor: '#D0D9EE',
  },
  textoTipo: {
    fontSize: 15,
    fontWeight: '700',
  },
  textoTipoAtivo: {
    color: '#FFF',
  },
  textoTipoInativo: {
    color: colors.primary,
  },
  inputCaixa: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    height: 48,
    fontSize: 14,
    color: colors.textPrimary,
  },
  inputAreaTexto: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingTop: 12,
    height: 90,
    textAlignVertical: 'top',
    fontSize: 14,
    color: colors.textPrimary,
  },
  botaoSalvar: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 24,
  },
  botaoSalvarTexto: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});