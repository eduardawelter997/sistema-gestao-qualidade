// Tipagem das variáveis de ambiente EXPO_PUBLIC_* usadas em src/config/supabase.ts
// (veja .env.example). O prefixo EXPO_PUBLIC_ é o que faz o Expo incluir a
// variável no build do app, inclusive no build web.
declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_SUPABASE_URL?: string;
    EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
  }
}
