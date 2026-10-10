import { useState } from 'react';
import { ActivityIndicator, Image, Linking, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { centsToBRL, formatCompact, type RankedProduct } from '@viraliza/core';
import { api } from '../api';
import { storeColor, storeLabel, theme } from '../theme';

export function ProductCard({ product, loggedIn }: { product: RankedProduct; loggedIn: boolean }) {
  const [link, setLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!loggedIn) {
      setError('Entre na aba Conta para gerar links.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { link } = await api.createLink(product.id);
      const short = `${api.base}/r/${link.code}`;
      setLink(short);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.card}>
      <Image source={{ uri: product.imageUrl }} style={styles.image} />
      <View style={styles.badges}>
        <View style={[styles.badge, { backgroundColor: theme.colors.brand }]}>
          <Text style={styles.badgeText}>⚡ {product.viralScore}</Text>
        </View>
        {product.discountPercent >= 10 ? (
          <View style={[styles.badge, { backgroundColor: theme.colors.red }]}>
            <Text style={styles.badgeText}>-{product.discountPercent}%</Text>
          </View>
        ) : null}
        <View style={[styles.badge, { backgroundColor: storeColor(product.marketplace) }]}>
          <Text style={[styles.badgeText, { color: '#111' }]}>{storeLabel(product.marketplace)}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>{product.title}</Text>
        <View style={styles.row}>
          <Text style={styles.price}>{centsToBRL(product.priceCents)}</Text>
          {product.originalPriceCents && product.originalPriceCents > product.priceCents ? (
            <Text style={styles.priceWas}>{centsToBRL(product.originalPriceCents)}</Text>
          ) : null}
        </View>
        <Text style={styles.meta}>
          {product.rating ? `⭐ ${product.rating.toFixed(1)}  ` : ''}
          {product.salesCount ? `✅ ${formatCompact(product.salesCount)} vendidos` : ''}
        </Text>
        <Text style={styles.commission}>💰 Ganhe ~{centsToBRL(product.estimatedNetCommissionCents)}/venda</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {link ? (
          <View style={styles.linkBox}>
            <Text style={styles.linkText} numberOfLines={1}>{link}</Text>
            <View style={styles.actions}>
              <TouchableOpacity style={[styles.btn, styles.btnWhats]} onPress={() => Share.share({ message: `${product.title}\n${link}` })}>
                <Text style={styles.btnWhatsText}>Compartilhar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btn} onPress={() => Linking.openURL(product.url)}>
                <Text style={styles.btnText}>Ver loja</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={generate} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>🔗 Gerar link</Text>}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: theme.colors.panel, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden', marginBottom: 16 },
  image: { width: '100%', aspectRatio: 1.4, backgroundColor: theme.colors.panel2 },
  badges: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', gap: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: theme.radius.pill },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  body: { padding: 14, gap: 6 },
  title: { color: theme.colors.text, fontSize: 15, fontWeight: '600', lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  price: { color: theme.colors.text, fontSize: 20, fontWeight: '800' },
  priceWas: { color: theme.colors.muted, fontSize: 13, textDecorationLine: 'line-through' },
  meta: { color: theme.colors.muted, fontSize: 12 },
  commission: { color: theme.colors.green, fontSize: 13, fontWeight: '700' },
  error: { color: theme.colors.red, fontSize: 12 },
  btn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: theme.radius.sm, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.panel2, alignItems: 'center', flex: 1 },
  btnText: { color: theme.colors.text, fontWeight: '600', fontSize: 13 },
  btnPrimary: { backgroundColor: theme.colors.brand, borderWidth: 0, marginTop: 6 },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnWhats: { backgroundColor: '#25d366', borderWidth: 0 },
  btnWhatsText: { color: '#06331b', fontWeight: '700', fontSize: 13 },
  linkBox: { gap: 8, marginTop: 6 },
  linkText: { color: theme.colors.accent, fontSize: 12, fontFamily: 'monospace' },
  actions: { flexDirection: 'row', gap: 8 },
});
