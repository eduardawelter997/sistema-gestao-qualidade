/**
 * Client do Supabase. Substitui o antigo config/api.ts (URL do backend
 * Express) — agora o app fala direto com o Supabase (Auth + Postgres +
 * Storage), sem servidor próprio.
 *
 * As duas variáveis abaixo vêm do painel do Supabase em
 * Project Settings > API (Project URL e a chave "anon public").
 * Configure-as em app/.env (veja app/.env.example) — no build web, a
 * Vercel injeta essas mesmas variáveis a partir do próprio painel dela.
 */
import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase não configurado: defina EXPO_PUBLIC_SUPABASE_URL e ' +
      'EXPO_PUBLIC_SUPABASE_ANON_KEY (veja app/.env.example).'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // No navegador o próprio supabase-js usa localStorage; no app nativo
    // (Expo Go / build), guarda a sessão no AsyncStorage do dispositivo.
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // No navegador precisa ler o token que o link de "recuperar senha" do
    // Supabase devolve no final da URL (#access_token=...&type=recovery).
    detectSessionInUrl: Platform.OS === 'web',
  },
});
