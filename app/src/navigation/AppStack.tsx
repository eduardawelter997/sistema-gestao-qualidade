import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppStackParamList } from './types';
import AppTabs from './AppTabs';
import NovaOpScreen from '../screens/NovaOpScreen';

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AppTabs" component={AppTabs} />
      <Stack.Screen name="NovaOp" component={NovaOpScreen} />
    </Stack.Navigator>
  );
}