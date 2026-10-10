import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { centsToBRL } from '@viraliza/core';
import { api } from '../api';
import { theme } from '../theme';

type Me = Awaited<ReturnType<typeof api.me>>;

export function WalletScreen({ loggedIn }: { loggedIn: boolean }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!loggedIn) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setMe(await api.me());
    } catch {
      setMe(null);
    } finally {
      setLoading(false);
    }
  }, [loggedIn]);

  useEffect(() => {
    load();
  }, [load]);

  if (!loggedIn) return <View style={styles.center}><Text style={styles.muted}>Entre na aba Conta para ver sua carteira.</Text></View>;
  if (loading) return <View style={styles.center}><ActivityIndicator color={theme.colors.brand} size="large" /></View>;
  if (!me) return <View style={styles.center}><Text style={styles.muted}>Não foi possível carregar.</Text></View>;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Saldo disponível</Text>
        <Text style={styles.statValue}>{centsToBRL(me.wallet.balanceCents)}</Text>
      </View>
      <View style={styles.grid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total histórico</Text>
          <Text style={styles.statValueSm}>{centsToBRL(me.wallet.lifetimeCents)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Vendas</Text>
          <Text style={styles.statValueSm}>{me.stats.sales}</Text>
        </View>
      </View>
      <View style={styles.grid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Links</Text>
          <Text style={styles.statValueSm}>{me.stats.linksCount}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Cliques</Text>
          <Text style={styles.statValueSm}>{me.stats.clicks}</Text>
        </View>
      </View>

      <Text style={styles.section}>Extrato</Text>
      {me.wallet.entries.length === 0 ? (
        <Text style={styles.muted}>Nenhuma movimentação ainda.</Text>
      ) : (
        me.wallet.entries.map((e: any) => (
          <View key={e.id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{e.description}</Text>
              <Text style={styles.muted}>{new Date(e.createdAt).toLocaleDateString('pt-BR')}</Text>
            </View>
            <Text style={{ color: e.amountCents >= 0 ? theme.colors.green : theme.colors.red, fontWeight: '700' }}>
              {e.amountCents >= 0 ? '+' : ''}
              {centsToBRL(e.amountCents)}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  statCard: { flex: 1, backgroundColor: theme.colors.panel, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 16 },
  statLabel: { color: theme.colors.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  statValue: { color: theme.colors.text, fontSize: 28, fontWeight: '800', marginTop: 4 },
  statValueSm: { color: theme.colors.text, fontSize: 20, fontWeight: '800', marginTop: 4 },
  grid: { flexDirection: 'row', gap: 12 },
  section: { color: theme.colors.text, fontWeight: '700', fontSize: 16, marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.panel, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm, padding: 12 },
  rowTitle: { color: theme.colors.text, fontSize: 13, fontWeight: '600' },
  muted: { color: theme.colors.muted, fontSize: 12 },
});
