/**
 * Navegação por abas exibida depois que o usuário faz login.
 * Abas: Início, Busca, Favoritos e Mais.
 */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import { AppTabParamList } from './types';
import InicioScreen from '../screens/InicioScreen';
import BuscaScreen from '../screens/BuscaScreen';
import FavoritosScreen from '../screens/FavoritosScreen';
import MaisScreen from '../screens/MaisScreen';
import NovaOpScreen from '../screens/NovaOpScreen';
import CadastrarClienteScreen from '../screens/CadastrarClienteScreen';
import OpDetalheScreen from '../screens/OpDetalheScreen';
import NovoRegistroOpScreen from '../screens/NovoRegistroOpScreen';
import GestaoColaboradoresScreen from '../screens/GestaoColaboradoresScreen';
import ConvidarColaboradorScreen from '../screens/ConvidarColaboradorScreen';
import DetalhesColaboradorScreen from '../screens/DetalhesColaboradorScreen';
import PerfilScreen from '../screens/PerfilScreen';
import AlterarSenhaScreen from '../screens/AlterarSenhaScreen';
import NovaOcorrenciaScreen from '../screens/NovaOcorrenciaScreen';
import OcorrenciaDetalheScreen from '../screens/OcorrenciaDetalheScreen';
import NovaAcaoCorretivaScreen from '../screens/NovaAcaoCorretivaScreen';
import AcaoDetalheScreen from '../screens/AcaoDetalheScreen';
import NovoRecebimentoScreen from '../screens/NovoRecebimentoScreen';
import RecebimentoDetalheScreen from '../screens/RecebimentoDetalheScreen';
import FotosAnexosScreen from '../screens/FotosAnexosScreen';
import ClientesFornecedoresScreen from '../screens/ClientesFornecedoresScreen';
import SobreScreen from '../screens/SobreScreen';
import AjudaScreen from '../screens/AjudaScreen';
import IndicadoresScreen from '../screens/IndicadoresScreen';


const Tab = createBottomTabNavigator<AppTabParamList>();

export default function AppTabs() {
  return (
    <Tab.Navigator
      backBehavior="history"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 6 },
        tabBarIcon: ({ color, size }) => {
          const nomes: Record<keyof AppTabParamList, keyof typeof Ionicons.glyphMap> = {
            Inicio: 'home',
            Busca: 'search',
            Favoritos: 'star',
            Mais: 'ellipsis-horizontal',
            NovaOp: 'add-circle',
            CadastrarCliente: 'person-add',
            OpDetalhe: 'document-text',
            NovoRegistroOp: 'add-circle-outline',
            GestaoColaboradores: 'people',
            ConvidarColaborador: 'person-add-outline',
            DetalhesColaborador: 'person-circle-outline',
            Perfil: 'person-circle',
            AlterarSenha: 'lock-closed-outline',
            NovaOcorrencia: 'warning',
            OcorrenciaDetalhe: 'warning-outline',
            NovaAcaoCorretiva: 'construct',
            AcaoDetalhe: 'construct-outline',
            NovoRecebimento: 'cube',
            RecebimentoDetalhe: 'cube-outline',
            FotosAnexos: 'images',
            ClientesFornecedores: 'business-outline',
            Sobre: 'information-circle-outline',
            Ajuda: 'help-circle-outline',
            Indicadores: 'stats-chart-outline',
          };
          return <Ionicons name={nomes[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Inicio"
        component={InicioScreen}
        options={{ title: 'Início' }}
      />
      
      <Tab.Screen name="Busca" component={BuscaScreen} />
      <Tab.Screen name="Favoritos" component={FavoritosScreen} />
      <Tab.Screen name="Mais" component={MaisScreen} />

      <Tab.Screen 
        name="NovaOp" 
        component={NovaOpScreen} 
        options={{ 
        tabBarButton: () => null, 
        headerShown: false 
        }} 
      />
      <Tab.Screen
        name="CadastrarCliente"
        component={CadastrarClienteScreen}
        options={{
        tabBarButton: () => null,
        headerShown: false
        }}
      />
      <Tab.Screen
        name="OpDetalhe"
        component={OpDetalheScreen}
        options={{ tabBarButton: () => null, headerShown: false }}
      />
      <Tab.Screen
        name="NovoRegistroOp"
        component={NovoRegistroOpScreen}
        options={{ tabBarButton: () => null, headerShown: false }}
      />

      <Tab.Screen
        name="GestaoColaboradores"
        component={GestaoColaboradoresScreen}
        options={{
        tabBarButton: () => null,
        headerShown: false
        }}
      />

      <Tab.Screen
        name="ConvidarColaborador"
        component={ConvidarColaboradorScreen}
        options={{ tabBarButton: () => null, headerShown: false }}
      />

      <Tab.Screen
        name="DetalhesColaborador"
        component={DetalhesColaboradorScreen}
        options={{ tabBarButton: () => null, headerShown: false }}
      />

      <Tab.Screen 
        name="Perfil" 
        component={PerfilScreen} 
        options={{ tabBarButton: () => null, headerShown: false}} 
      />

      <Tab.Screen
        name="AlterarSenha"
        component={AlterarSenhaScreen}
        options={{ tabBarButton: () => null, headerShown: false}}
      />

      <Tab.Screen
        name="NovaOcorrencia"
        component={NovaOcorrenciaScreen}
        options={{ tabBarButton: () => null, headerShown: false }}
      />
      <Tab.Screen
        name="OcorrenciaDetalhe"
        component={OcorrenciaDetalheScreen}
        options={{ tabBarButton: () => null, headerShown: false }}
      />
      <Tab.Screen
        name="NovaAcaoCorretiva"
        component={NovaAcaoCorretivaScreen}
        options={{ tabBarButton: () => null, headerShown: false }}
      />
      <Tab.Screen
        name="AcaoDetalhe"
        component={AcaoDetalheScreen}
        options={{ tabBarButton: () => null, headerShown: false }}
      />
      <Tab.Screen
        name="NovoRecebimento"
        component={NovoRecebimentoScreen}
        options={{ tabBarButton: () => null, headerShown: false }}
      />
      <Tab.Screen
        name="RecebimentoDetalhe"
        component={RecebimentoDetalheScreen}
        options={{ tabBarButton: () => null, headerShown: false }}
      />
      <Tab.Screen
        name="FotosAnexos"
        component={FotosAnexosScreen}
        options={{ tabBarButton: () => null, headerShown: false }}
      />

      <Tab.Screen 
        name="ClientesFornecedores" 
        component={ClientesFornecedoresScreen} 
        options={{ tabBarButton: () => null, headerShown: false }} 
      />

      <Tab.Screen 
        name="Sobre" 
        component={SobreScreen} 
        options={{ tabBarButton: () => null, headerShown: false }} 
      />

      <Tab.Screen 
        name="Ajuda" 
        component={AjudaScreen} 
        options={{ tabBarButton: () => null, headerShown: false }} 
      />

      <Tab.Screen 
        name="Indicadores" 
        component={IndicadoresScreen} 
        options={{ tabBarButton: () => null, headerShown: false }} 
      />
    </Tab.Navigator>
  );
}
