import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { RankedProduct } from '@viraliza/core';
import { api } from '../api';
import { ProductCard } from '../components/ProductCard';
import { theme } from '../theme';

const SORTS = [
  { id: 'viral', label: '🔥 Virais' },
  { id: 'sales', label: '📈 Vendidos' },
  { id: 'commission', label: '💰 Comissão' },
  { id: 'discount', label: '🏷️ Desconto' },
];

const STORES = [
  { id: 'all', label: 'Todas' },
  { id: 'mercadolivre', label: 'Mercado Livre' },
  { id: 'shopee', label: 'Shopee' },
  { id: 'amazon', label: 'Amazon' },
];

export function FeedScreen({ loggedIn, onRequireLogin }: { loggedIn: boolean; onRequireLogin: () => void }) {
  const [items, setItems] = useState<RankedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sort, setSort] = useState('viral');
  const [marketplace, setMarketplace] = useState('all');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const page = await api.feed({ sort, marketplace, q: query, limit: 30 });
      setItems(page.items);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [sort, marketplace, query]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Buscar produto (ex.: fone, airfryer…)"
        placeholderTextColor={theme.colors.muted}
        value={q}
        onChangeText={setQ}
        onSubmitEditing={() => setQuery(q)}
        returnKeyType="search"
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips} contentContainerStyle={{ gap: 8 }}>
        {STORES.map((s) => (
          <TouchableOpacity key={s.id} onPress={() => setMarketplace(s.id)} style={[styles.chip, marketplace === s.id && styles.chipActive]}>
            <Text style={[styles.chipText, marketplace === s.id && styles.chipTextActive]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips} contentContainerStyle={{ gap: 8 }}>
        {SORTS.map((s) => (
          <TouchableOpacity key={s.id} onPress={() => setSort(s.id)} style={[styles.chip, sort === s.id && styles.chipActive]}>
            <Text style={[styles.chipText, sort === s.id && styles.chipTextActive]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading && items.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.brand} size="large" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ProductCard product={item} loggedIn={loggedIn} />}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await load();
                setRefreshing(false);
              }}
              tintColor={theme.colors.brand}
            />
          }
          ListEmptyComponent={<Text style={styles.empty}>Nenhum produto encontrado.</Text>}
        />
      )}
      {!loggedIn ? (
        <TouchableOpacity style={styles.loginHint} onPress={onRequireLogin}>
          <Text style={styles.loginHintText}>Entre para gerar e salvar seus links de afiliado →</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  search: { backgroundColor: theme.colors.panel, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm, paddingHorizontal: 14, paddingVertical: 12, color: theme.colors.text, marginBottom: 10 },
  chips: { flexGrow: 0, marginBottom: 10 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: theme.radius.pill, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.panel },
  chipActive: { backgroundColor: theme.colors.brand, borderColor: theme.colors.brand },
  chipText: { color: theme.colors.muted, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { color: theme.colors.muted, textAlign: 'center', marginTop: 40 },
  loginHint: { backgroundColor: theme.colors.panel2, padding: 12, borderRadius: theme.radius.sm, marginTop: 8 },
  loginHintText: { color: theme.colors.accent, textAlign: 'center', fontWeight: '600', fontSize: 13 },
});
