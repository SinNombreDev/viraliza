# 🗺️ Roadmap — fases de produto

A Viraliza já nasce com um **MVP completo e executável** (Fase 0). As fases
seguintes ligam as integrações reais, abrem os canais de aquisição e escalam o
negócio. Cada fase é independente: dá para lançar sem esperar a próxima.

> Legenda: ✅ pronto · 🔜 próximo · 🧭 planejado

---

## ✅ Fase 0 — MVP executável (concluída)

O núcleo roda ponta a ponta em **modo demo**, sem nenhuma chave.

- ✅ Monorepo TypeScript (`apps/web`, `apps/mobile`, `packages/*`).
- ✅ `@viraliza/core`: motor de comissão, score viral, gerador de links e textos
  de compartilhamento (WhatsApp, Instagram, TikTok, Telegram).
- ✅ `@viraliza/marketplaces`: adapters Mercado Livre / Shopee / Amazon + catálogo
  demo e feed agregado com ranking viral.
- ✅ `@viraliza/ai`: agente de vendas **"Vira"**, ancorado no catálogo real.
- ✅ `@viraliza/whatsapp`: provider mock (outbox) + Meta Cloud API + webhook.
- ✅ `@viraliza/db`: store em memória com seed + schema Prisma para Postgres.
- ✅ Web (Next.js): landing, login, planos, painel, explorar, agente, links e carteira.
- ✅ API: feed, produtos, links, chat, auth, assinatura, webhook de WhatsApp e
  postback de conversão.
- ✅ App mobile (Expo) para Android e iOS.
- ✅ Testes (24), typecheck estrito e script de smoke ponta a ponta.

**Critério de saída:** `npm run dev` + `scripts/smoke.ps1` passam; conta demo
gera link, registra venda e credita a carteira. ✔

---

## 🔜 Fase 1 — Go-live com integrações reais

Objetivo: **sair do mock e operar de verdade no Brasil**, mantendo o fluxo atual.

- 🔜 **Marketplaces reais** (`MARKETPLACE_MODE=live`): credenciais de Mercado
  Livre, Shopee Affiliate Open API e Amazon PA-API (ver `docs/INTEGRATIONS.md`).
- 🔜 **Banco de produção**: `DATABASE_URL` + `prisma migrate` + trocar `MemoryStore`
  por `PrismaStore`.
- 🔜 **WhatsApp Cloud API**: número verificado, templates aprovados (`oferta_diaria`)
  e webhook assinado no domínio HTTPS.
- 🔜 **Pagamentos**: Stripe (assinatura recorrente) e **PIX** (pagamento único),
  com webhook flipping o plano de verdade.
- 🔜 **Postbacks de conversão assinados e idempotentes** por marketplace — base do
  cálculo de comissão confiável.
- 🔜 **Antifraude v1**: deduplicação de cliques, janela de atribuição e detecção de
  auto-compra.
- 🔜 **Payout**: fila de saques (gateway PIX), mínimo de R$ 50 e histórico auditável.

**Critério de saída:** um usuário real cria link, uma venda real é atribuída e a
comissão é paga via PIX. ✔

---

## 🧭 Fase 2 — Automação e crescimento

Objetivo: transformar a Viraliza em uma **máquina de distribuição** quase sem
intervenção humana.

- 🧭 **Agente proativo**: o "Vira" monta ofertas do dia e dispara broadcast
  (com *opt-in*) nos melhores horários por segmento.
- 🧭 **Agendamento e automações**: regras do tipo "poste os 3 mais virais às 9h
  e às 19h", com fila e registro de envio.
- 🧭 **Catálogo colaborativo**: usuários marcam produtos e o score viral aprende
  com cliques/conversões reais (não só popularidade pública).
- 🧭 **SEO/OG dinâmico**: páginas públicas de produto (`/p/[id]`) com imagem e
  preview otimizados para WhatsApp, Google e redes.
- 🧭 **Programa de indicação**: painel de convites, bônus de 5% já modelado no core.
- 🧭 **Analytics do afiliado**: cliques → conversões → receita, por canal e por link.
- 🧭 **Multi-idioma e multi-moeda** para futura expansão LATAM.

**Critério de saída:** > 70% dos links gerados sem ação manual do time; receita
recorrente (assinaturas) cobrindo o custo de infra + IA. ✔

---

## 🧭 Fase 3 — Escala e ecossistema

Objetivo: crescer produto, canais e time.

- 🧭 **Publicação nas lojas**: build de produção do app (EAS), App Store e
  Google Play, com deep links e *push notifications*.
- 🧭 **Mais marketplaces**: Magalu, Americanas, AliExpress e afiliados diretos.
- 🧭 **Planos de time / Business**: contas multiusuário, relatórios e API de
  afiliados para parceiros.
- 🧭 **Marketplace interno** de ofertas de criadores (curadoria + repasse).
- 🧭 **IA avançada**: geração de criativos (copy + imagem), A/B de mensagens e
  detecção de tendência em tempo real.
- 🧭 **Observabilidade**: monitoramento de conversões, alertas de queda de
  atribuição e antifraude v2 com ML.

---

## 🧭 Backlog / ideias

- Extensão de navegador para gerar link direto da página do produto.
- Bot de Telegram/Discord reaproveitando o provider de mensagens.
- Modo "vitrine" para pequenos influenciadores (catálogo pessoal).
- Comparador de preços entre os 3 marketplaces com alerta de queda.
- Gamificação (missões, streak, ranking de afiliados).

---

## 📌 Princípios que não mudam

1. **Sem promessa de renda garantida** — comissões são estimativas baseadas em
   dados públicos.
2. **Adapter-first** — todo mock tem caminho real sem reescrever código.
3. **Compliance WhatsApp** — só envios com *opt-in* e templates aprovados.
4. **Transparência no dinheiro** — split de comissão puro, testado e auditável em
   `packages/core/src/commission.ts`.
