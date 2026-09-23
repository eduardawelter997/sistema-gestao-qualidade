/**
 * Modal de imagem em tela cheia com zoom — usado nas telas que mostram
 * fotos anexadas (Fotos e Anexos, Detalhe da OP).
 *
 * Zoom: pinça com dois dedos no celular, roda do mouse no navegador, ou
 * duplo toque/clique (alterna entre 1x e 2.5x). Arrasta com um dedo/mouse
 * pra mover a imagem quando estiver ampliada.
 */
import React, { useRef, useState } from 'react';
import {
  Modal,
  View,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
  PanResponder,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const ESCALA_MIN = 1;
const ESCALA_MAX = 5;
const ESCALA_DUPLO_TOQUE = 2.5;

interface Props {
  url: string | null;
  aoFechar: () => void;
}

function distanciaEntreToques(touches: any[]) {
  const [a, b] = touches;
  return Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
}

export default function VisualizadorImagem({ url, aoFechar }: Props) {
  const [escala, setEscala] = useState(1);
  const [translado, setTranslado] = useState({ x: 0, y: 0 });

  const escalaRef = useRef(1);
  const transladoRef = useRef({ x: 0, y: 0 });
  const distanciaInicial = useRef<number | null>(null);
  const escalaNoInicioPinca = useRef(1);
  const transladoNoInicioArrasto = useRef({ x: 0, y: 0 });
  const ultimoToque = useRef(0);

  function aplicarEscala(nova: number) {
    const limitada = Math.min(Math.max(nova, ESCALA_MIN), ESCALA_MAX);
    escalaRef.current = limitada;
    setEscala(limitada);
    if (limitada === 1) {
      transladoRef.current = { x: 0, y: 0 };
      setTranslado({ x: 0, y: 0 });
    }
  }

  function resetar() {
    aplicarEscala(1);
  }

  function aoFecharEResetar() {
    resetar();
    aoFechar();
  }

  function alternarZoomNoToque() {
    const agora = Date.now();
    const duploToque = agora - ultimoToque.current < 280;
    ultimoToque.current = agora;
    if (duploToque) {
      aplicarEscala(escalaRef.current > 1 ? 1 : ESCALA_DUPLO_TOQUE);
    }
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: (_, gestureState) =>
        Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2,
      onPanResponderGrant: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length === 2) {
          distanciaInicial.current = distanciaEntreToques(touches);
          escalaNoInicioPinca.current = escalaRef.current;
        } else {
          alternarZoomNoToque();
        }
        transladoNoInicioArrasto.current = transladoRef.current;
      },
      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length === 2) {
          const distanciaAtual = distanciaEntreToques(touches);
          if (distanciaInicial.current) {
            const fator = distanciaAtual / distanciaInicial.current;
            aplicarEscala(escalaNoInicioPinca.current * fator);
          }
        } else if (escalaRef.current > 1) {
          const novo = {
            x: transladoNoInicioArrasto.current.x + gestureState.dx,
            y: transladoNoInicioArrasto.current.y + gestureState.dy,
          };
          transladoRef.current = novo;
          setTranslado(novo);
        }
      },
      onPanResponderRelease: () => {
        distanciaInicial.current = null;
      },
    })
  ).current;

  // No navegador (desktop), permite dar zoom com a roda do mouse.
  const propsWeb =
    Platform.OS === 'web'
      ? {
          onWheel: (e: any) => {
            e.preventDefault?.();
            aplicarEscala(escalaRef.current - e.deltaY * 0.0015 * escalaRef.current);
          },
          // @ts-ignore — só existe no DOM do navegador (react-native-web repassa a prop)
          onDoubleClick: () => aplicarEscala(escalaRef.current > 1 ? 1 : ESCALA_DUPLO_TOQUE),
        }
      : {};

  return (
    <Modal visible={!!url} transparent animationType="fade" onRequestClose={aoFecharEResetar}>
      <View style={styles.fundo} {...propsWeb}>
        <TouchableOpacity style={styles.botaoFechar} onPress={aoFecharEResetar} hitSlop={12}>
          <Ionicons name="close" size={28} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.areaImagem} {...panResponder.panHandlers}>
          {!!url && (
            <Image
              source={{ uri: url }}
              style={[
                styles.imagem,
                {
                  transform: [
                    { translateX: translado.x },
                    { translateY: translado.y },
                    { scale: escala },
                  ],
                },
              ]}
              resizeMode="contain"
            />
          )}
        </View>

        {escala > 1 && (
          <TouchableOpacity style={styles.botaoResetar} onPress={resetar} hitSlop={8}>
            <Ionicons name="contract-outline" size={16} color="#FFF" />
            <Text style={styles.botaoResetarTexto}>Redefinir zoom</Text>
          </TouchableOpacity>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fundo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  botaoFechar: {
    position: 'absolute',
    top: 48,
    right: 20,
    zIndex: 2,
  },
  areaImagem: {
    width: '100%',
    height: '80%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagem: {
    width: '100%',
    height: '100%',
  },
  botaoResetar: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  botaoResetarTexto: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
