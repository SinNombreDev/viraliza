import { useState } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FeedScreen } from './src/screens/FeedScreen';
import { AgentScreen } from './src/screens/AgentScreen';
import { LinksScreen } from './src/screens/LinksScreen';
import { WalletScreen } from './src/screens/WalletScreen';
import { AccountScreen } from './src/screens/AccountScreen';
import { theme } from './src/theme';

type Tab = 'feed' | 'agent' | 'links' | 'wallet' | 'account';
interface SessionUser {
  id: string;
  name: string;
  email: string;
  plan: string;
  referralCode: string;
  balanceCents: number;
  lifetimeEarningsCents: number;
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'feed', label: 'Explorar', icon: '🔥' },
  { id: 'agent', label: 'Agente', icon: '🤖' },
  { id: 'links', label: 'Links', icon: '🔗' },
  { id: 'wallet', label: 'Carteira', icon: '💰' },
  { id: 'account', label: 'Conta', icon: '👤' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('feed');
  const [user, setUser] = useState<SessionUser | null>(null);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <View style={styles.badge}><Text style={styles.badgeIcon}>⚡</Text></View>
            <Text style={styles.logo}>
              Viral<Text style={{ color: theme.colors.brand2 }}>iza</Text>
            </Text>
          </View>
          <Text style={styles.tagline}>{user ? user.name.split(' ')[0] : 'Venda viral automática'}</Text>
        </View>

        <View style={styles.content}>
          {tab === 'feed' ? <FeedScreen loggedIn={!!user} onRequireLogin={() => setTab('account')} /> : null}
          {tab === 'agent' ? <AgentScreen loggedIn={!!user} /> : null}
          {tab === 'links' ? <LinksScreen loggedIn={!!user} /> : null}
          {tab === 'wallet' ? <WalletScreen loggedIn={!!user} /> : null}
          {tab === 'account' ? (
            <AccountScreen user={user} onLogin={setUser} onLogout={() => setUser(null)} />
          ) : null}
        </View>

        <View style={styles.tabbar}>
          {TABS.map((t) => (
            <TouchableOpacity key={t.id} style={styles.tab} onPress={() => setTab(t.id)}>
              <Text style={[styles.tabIcon, tab === t.id && styles.tabActive]}>{t.icon}</Text>
              <Text style={[styles.tabLabel, tab === t.id && styles.tabActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { width: 30, height: 30, borderRadius: 9, backgroundColor: theme.colors.brand, alignItems: 'center', justifyContent: 'center' },
  badgeIcon: { fontSize: 16 },
  logo: { color: theme.colors.text, fontSize: 18, fontWeight: '800' },
  tagline: { color: theme.colors.muted, fontSize: 12 },
  content: { flex: 1 },
  tabbar: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: theme.colors.panel },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 2 },
  tabIcon: { fontSize: 18, opacity: 0.5 },
  tabLabel: { color: theme.colors.muted, fontSize: 10, fontWeight: '600' },
  tabActive: { opacity: 1, color: theme.colors.text },
});
