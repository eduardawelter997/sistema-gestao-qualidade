/**
 * Pilha de telas exibida quando NÃO há usuário logado: Login, Primeiro
 * acesso e o fluxo de recuperação de senha.
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthStackParamList } from './types';
import LoginScreen from '../screens/LoginScreen';
import PrimeiroAcessoScreen from '../screens/PrimeiroAcessoScreen';
import RecuperarSenhaScreen from '../screens/RecuperarSenhaScreen';
import VerificarCodigoScreen from '../screens/VerificarCodigoScreen';
import RedefinirSenhaScreen from '../screens/RedefinirSenhaScreen';
import AlterarSenhaScreen from '../screens/AlterarSenhaScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="PrimeiroAcesso" component={PrimeiroAcessoScreen} />
      <Stack.Screen name="RecuperarSenha" component={RecuperarSenhaScreen} />
      <Stack.Screen name="VerificarCodigo" component={VerificarCodigoScreen} />
      <Stack.Screen name="RedefinirSenha" component={RedefinirSenhaScreen} />
      <Stack.Screen name="AlterarSenha" component={AlterarSenhaScreen} />
    </Stack.Navigator>
  );
}
