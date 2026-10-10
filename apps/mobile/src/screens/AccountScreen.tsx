import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { centsToBRL } from '@viraliza/core';
import { api, setToken } from '../api';
import { theme } from '../theme';

interface SessionUser {
  id: string;
  name: string;
  email: string;
  plan: string;
  referralCode: string;
  balanceCents: number;
  lifetimeEarningsCents: number;
}

export function AccountScreen({
  user,
  onLogin,
  onLogout,
}: {
  user: SessionUser | null;
  onLogin: (user: SessionUser) => void;
  onLogout: () => void;
}) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login(asDemo = false) {
    const mail = asDemo ? 'demo@viraliza.app' : email;
    if (!mail.includes('@')) {
      setError('Informe um e-mail válido.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(mail, asDemo ? undefined : name);
      setToken(res.token);
      onLogin(res.user as SessionUser);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao entrar.');
    } finally {
      setLoading(false);
    }
  }

  if (user) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.hello}>Olá, {user.name.split(' ')[0]} 👋</Text>
          <Text style={styles.muted}>{user.email}</Text>
          <Text style={styles.plan}>Plano: {user.plan}</Text>
          <Text style={styles.balance}>{centsToBRL(user.balanceCents)}</Text>
          <Text style={styles.muted}>Saldo disponível</Text>
          <Text style={styles.referral}>
            Seu convite: <Text style={{ color: theme.colors.accent }}>{user.referralCode}</Text>
          </Text>
          <TouchableOpacity
            style={[styles.btn, styles.logout]}
            onPress={() => {
              setToken(null);
              onLogout();
            }}
          >
            <Text style={styles.btnText}>Sair</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.server}>Servidor: {api.base}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.hello}>Entrar na Viraliza</Text>
        <Text style={styles.muted}>Use seu e-mail para começar a gerar links de afiliado.</Text>

        <TextInput
          style={styles.input}
          placeholder="Seu nome (opcional)"
          placeholderTextColor={theme.colors.muted}
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="voce@email.com"
          placeholderTextColor={theme.colors.muted}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={[styles.btn, styles.primary]} onPress={() => login(false)} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>⚡ Entrar / Criar conta</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.btn} onPress={() => login(true)} disabled={loading}>
          <Text style={styles.btnText}>Usar conta demo</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.server}>
        Conectando em {api.base}
        {'\n'}Em um celular físico, defina EXPO_PUBLIC_API_URL com o IP do seu computador.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 16 },
  card: { backgroundColor: theme.colors.panel, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 20, gap: 10 },
  hello: { color: theme.colors.text, fontSize: 20, fontWeight: '800' },
  muted: { color: theme.colors.muted, fontSize: 13 },
  plan: { color: theme.colors.text, fontWeight: '600', marginTop: 4 },
  balance: { color: theme.colors.green, fontSize: 30, fontWeight: '800' },
  referral: { color: theme.colors.text, marginTop: 6 },
  input: { backgroundColor: theme.colors.panel2, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm, paddingHorizontal: 14, paddingVertical: 12, color: theme.colors.text },
  btn: { paddingVertical: 12, borderRadius: theme.radius.sm, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.panel2, alignItems: 'center', marginTop: 6 },
  btnText: { color: theme.colors.text, fontWeight: '600' },
  primary: { backgroundColor: theme.colors.brand, borderWidth: 0 },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  logout: { borderColor: theme.colors.red + '66' },
  error: { color: theme.colors.red, fontSize: 12 },
  server: { color: theme.colors.muted, fontSize: 11, textAlign: 'center' },
});
