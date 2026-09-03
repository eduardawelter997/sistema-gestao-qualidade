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
import GestaoFuncionariosScreen from '../screens/GestaoFuncionariosScreen';
import ConvidarFuncionarioScreen from '../screens/ConvidarFuncionarioScreen';
import DetalhesFuncionarioScreen from '../screens/DetalhesFuncionarioScreen';
import PerfilScreen from '../screens/PerfilScreen';
import AlterarSenhaScreen from '../screens/AlterarSenhaScreen';


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
            GestaoFuncionarios: 'people',
            ConvidarFuncionario: 'person-add-outline',
            DetalhesFuncionario: 'person-circle-outline',
            Perfil: 'person-circle',
            AlterarSenha: 'lock-closed-outline',
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
        name="GestaoFuncionarios" 
        component={GestaoFuncionariosScreen} 
        options={{ 
        tabBarButton: () => null, 
        headerShown: false 
        }} 
      />

      <Tab.Screen 
        name="ConvidarFuncionario" 
        component={ConvidarFuncionarioScreen} 
        options={{ tabBarButton: () => null, headerShown: false }} 
      />

      <Tab.Screen 
        name="DetalhesFuncionario" 
        component={DetalhesFuncionarioScreen} 
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
    </Tab.Navigator>
  );
}
