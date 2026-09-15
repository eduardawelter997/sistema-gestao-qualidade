/**
 * Pilha de telas exibida quando NÃO há usuário logado: Login e o fluxo de
 * recuperação de senha.
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthStackParamList } from './types';
import LoginScreen from '../screens/LoginScreen';
import RecuperarSenhaScreen from '../screens/RecuperarSenhaScreen';
import AlterarSenhaScreen from '../screens/AlterarSenhaScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="RecuperarSenha" component={RecuperarSenhaScreen} />
      <Stack.Screen name="AlterarSenha" component={AlterarSenhaScreen} />
    </Stack.Navigator>
  );
}
