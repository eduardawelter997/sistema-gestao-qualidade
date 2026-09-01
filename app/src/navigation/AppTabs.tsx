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

const Tab = createBottomTabNavigator<AppTabParamList>();

export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 6 },
        tabBarIcon: ({ color, size }) => {
          // Escolhe o ícone conforme a aba
          const nomes: Record<keyof AppTabParamList, keyof typeof Ionicons.glyphMap> = {
            Inicio: 'home',
            Busca: 'search',
            Favoritos: 'star',
            Mais: 'ellipsis-horizontal',
            NovaOp: 'add-circle',
            
          };
          return <Ionicons name={nomes[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="NovaOp" 
        component={NovaOpScreen} 
        options={{ 
        tabBarButton: () => null, // 👈 Esconde da barra de navegação inferior
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
        name="Inicio"
        component={InicioScreen}
        options={{ title: 'Início' }}
      />
      <Tab.Screen name="Busca" component={BuscaScreen} />
      <Tab.Screen name="Favoritos" component={FavoritosScreen} />
      <Tab.Screen name="Mais" component={MaisScreen} />
    </Tab.Navigator>
  );
}
