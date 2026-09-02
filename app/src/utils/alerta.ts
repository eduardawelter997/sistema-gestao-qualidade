/**
 * Alert.alert do React Native não funciona no modo web (react-native-web
 * não implementa) — essas funções usam window.alert/window.confirm no
 * navegador e caem para o Alert nativo no Android/iOS.
 */
import { Alert, Platform } from 'react-native';

export function alertar(titulo: string, mensagem?: string) {
  if (Platform.OS === 'web') {
    window.alert(mensagem ? `${titulo}\n\n${mensagem}` : titulo);
  } else {
    Alert.alert(titulo, mensagem);
  }
}

export function confirmar(
  titulo: string,
  mensagem: string,
  aoConfirmar: () => void,
  textoConfirmar = 'Confirmar'
) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${titulo}\n\n${mensagem}`)) aoConfirmar();
  } else {
    Alert.alert(titulo, mensagem, [
      { text: 'Cancelar', style: 'cancel' },
      { text: textoConfirmar, style: 'destructive', onPress: aoConfirmar },
    ]);
  }
}
