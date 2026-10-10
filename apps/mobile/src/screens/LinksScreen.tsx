import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { centsToBRL, type AffiliateLink } from '@viraliza/core';
import { api } from '../api';
import { storeLabel, theme } from '../theme';

export function LinksScreen({ loggedIn }: { loggedIn: boolean }) {
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!loggedIn) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await api.links();
      setLinks(data.items);
    } catch {
      setLinks([]);
    } finally {
      setLoading(false);
    }
  }, [loggedIn]);

  useEffect(() => {
    load();
  }, [load]);

  if (!loggedIn) return <View style={styles.center}><Text style={styles.empty}>Entre na aba Conta para ver seus links.</Text></View>;
  if (loading) return <View style={styles.center}><ActivityIndicator color={theme.colors.brand} size="large" /></View>;

  return (
    <FlatList
      style={styles.list}
      data={links}
      keyExtractor={(l) => l.id}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      ListEmptyComponent={<Text style={styles.empty}>Você ainda não criou links. Vá em Explorar!</Text>}
      renderItem={({ item }) => {
        const short = `${api.base}/r/${item.code}`;
        return (
          <View style={styles.card}>
            <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.meta}>
              {storeLabel(item.marketplace)} · {item.clicks} cliques · {item.conversions} vendas ·{' '}
              <Text style={{ color: theme.colors.green }}>{centsToBRL(item.earningsCents)}</Text>
            </Text>
            <Text style={styles.code}>{short}</Text>
            <View style={styles.actions}>
              <TouchableOpacity style={[styles.btn, styles.whats]} onPress={() => Linking.openURL(item.whatsappShareUrl)}>
                <Text style={styles.whatsText}>WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btn} onPress={() => Share.share({ message: `${item.title}\n${short}` })}>
                <Text style={styles.btnText}>Compartilhar</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  empty: { color: theme.colors.muted, textAlign: 'center' },
  card: { backgroundColor: theme.colors.panel, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 14, gap: 6 },
  title: { color: theme.colors.text, fontWeight: '600', fontSize: 14 },
  meta: { color: theme.colors.muted, fontSize: 12 },
  code: { color: theme.colors.accent, fontSize: 12, fontFamily: 'monospace' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 6 },
  btn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: theme.radius.sm, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.panel2 },
  btnText: { color: theme.colors.text, fontWeight: '600', fontSize: 13 },
  whats: { backgroundColor: '#25d366', borderWidth: 0 },
  whatsText: { color: '#06331b', fontWeight: '700', fontSize: 13 },
});
