import { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { ChatMessage } from '@viraliza/core';
import { api } from '../api';
import { theme } from '../theme';

interface UiMessage {
  role: 'user' | 'assistant';
  content: string;
  link?: string | null;
}

const SUGGESTIONS = ['O que está bombando?', 'Fone bluetooth', 'Beleza', 'Quanto eu ganho?'];

export function AgentScreen({ loggedIn }: { loggedIn: boolean }) {
  const [messages, setMessages] = useState<UiMessage[]>([
    { role: 'assistant', content: 'Olá! 👋 Sou o Vira. Me diga o que você quer vender ou peça os mais virais do momento. 🔥' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  async function send(text: string) {
    const message = text.trim();
    if (!message || loading) return;
    setInput('');
    const history: ChatMessage[] = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    setLoading(true);
    try {
      const res = await api.chat(message, history);
      setMessages((prev) => [...prev, { role: 'assistant', content: res.message.content, link: res.createdLink?.whatsappShareUrl ?? null }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: 'assistant', content: e instanceof Error ? e.message : 'Erro de conexão.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((m, i) => (
          <View key={i} style={[styles.bubble, m.role === 'user' ? styles.user : styles.bot]}>
            <Text style={m.role === 'user' ? styles.userText : styles.botText}>{m.content}</Text>
            {m.link ? <Text style={styles.link}>{m.link}</Text> : null}
          </View>
        ))}
        {loading ? (
          <View style={[styles.bubble, styles.bot]}>
            <ActivityIndicator color={theme.colors.brand} />
          </View>
        ) : null}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestions} contentContainerStyle={{ gap: 8, paddingHorizontal: 12 }}>
        {SUGGESTIONS.map((s) => (
          <TouchableOpacity key={s} style={styles.chip} onPress={() => send(s)} disabled={loading}>
            <Text style={styles.chipText}>{s}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Escreva para o Vira…"
          placeholderTextColor={theme.colors.muted}
          onSubmitEditing={() => send(input)}
        />
        <TouchableOpacity style={styles.send} onPress={() => send(input)} disabled={loading}>
          <Text style={styles.sendText}>Enviar</Text>
        </TouchableOpacity>
      </View>
      {!loggedIn ? <Text style={styles.hint}>Entre na aba Conta para gerar links automáticos.</Text> : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bubble: { maxWidth: '85%', padding: 12, borderRadius: theme.radius.md },
  user: { alignSelf: 'flex-end', backgroundColor: theme.colors.brand, borderBottomRightRadius: 4 },
  bot: { alignSelf: 'flex-start', backgroundColor: theme.colors.panel2, borderWidth: 1, borderColor: theme.colors.border, borderBottomLeftRadius: 4 },
  userText: { color: '#fff', fontSize: 14 },
  botText: { color: theme.colors.text, fontSize: 14, lineHeight: 20 },
  link: { color: theme.colors.accent, marginTop: 8, fontSize: 13 },
  suggestions: { flexGrow: 0, maxHeight: 48, paddingVertical: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: theme.radius.pill, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.panel, height: 34, justifyContent: 'center' },
  chipText: { color: theme.colors.muted, fontSize: 12, fontWeight: '600' },
  inputRow: { flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: theme.colors.border },
  input: { flex: 1, backgroundColor: theme.colors.panel, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm, paddingHorizontal: 14, color: theme.colors.text },
  send: { backgroundColor: theme.colors.brand, paddingHorizontal: 18, justifyContent: 'center', borderRadius: theme.radius.sm },
  sendText: { color: '#fff', fontWeight: '700' },
  hint: { color: theme.colors.muted, fontSize: 12, textAlign: 'center', paddingBottom: 10 },
});
