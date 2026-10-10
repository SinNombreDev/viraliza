# Arquitetura — Viraliza

## Visão geral

```
                         ┌──────────────────────────────────────────────┐
   WhatsApp (Meta)  ───▶ │                                              │
                         │               apps/web (Next.js)             │
   Android / iOS    ───▶ │   • Site + painel (App Router)               │
     (Expo/RN)           │   • API routes (/api/*)                      │
                         │   • Webhooks (WhatsApp, conversões)          │
                         │   • /r/:code  → redirect rastreável          │
                         └───────┬───────────────┬──────────────┬───────┘
                                 │               │              │
                     ┌───────────▼──┐   ┌────────▼──────┐  ┌────▼─────────┐
                     │ @viraliza/ai │   │ marketplaces  │  │  whatsapp    │
                     │  SalesAgent  │   │  adapters     │  │  provider    │
                     └───────┬──────┘   └────────┬──────┘  └────┬─────────┘
                             │                   │              │
                             └───────────┬───────┴──────────────┘
                                         │
                                   ┌─────▼──────┐        ┌─────────────┐
                                   │   core     │        │     db      │
                                   │ comissão,  │◀──────▶│ store +     │
                                   │ links,     │        │ Prisma      │
                                   │ viral      │        └─────────────┘
                                   └────────────┘
```

## Princípios de design

### 1. Um único cérebro (`packages/core`)
Regras de negócio que **não podem divergir** entre plataformas vivem em um só lugar:

- **`commission.ts`** — divide cada venda em: comissão bruta → taxa da Viraliza → líquido do usuário → bônus de indicação. Função **pura** e testada, então dá para recalcular qualquer pagamento histórico.
- **`link.ts`** — gera o código curto, injeta os parâmetros de afiliado certos de cada loja (`matt_word` no ML, gateway no Shopee, `tag` na Amazon) e escreve a legenda pt-BR para o WhatsApp.
- **`viral.ts`** — o *score viral* (0–100) que responde "quanto isso vende agora?", combinando vendas, nota/avaliações, desconto e momentum.
- **`pricing.ts`** — planos e taxas.

Web, mobile e API importam isso direto (workspaces npm). Uma mudança na regra vale para todo mundo.

### 2. Adapters em tudo (mock ↔ real)
O app nunca sabe se os dados são reais. Cada integração tem uma interface e duas implementações:

| Camada | Interface | Mock (padrão) | Real |
|---|---|---|---|
| Marketplaces | `MarketplaceAdapter` | `MockMarketplaceAdapter` (catálogo demo) | ML / Shopee / Amazon |
| IA | `AiProvider` | `MockAiProvider` (determinístico) | OpenAI / Azure OpenAI |
| WhatsApp | `WhatsAppProvider` | `MockWhatsAppProvider` (outbox) | Meta Cloud API |
| Banco | `DataStore` | `MemoryStore` (semeado) | `PrismaStore` (Postgres) |

O `MarketplaceService` escolhe o adapter por marketplace **conforme as credenciais existem** — dá para ter a Amazon real e o Shopee em demo ao mesmo tempo.

### 3. Grounding contra alucinação
O agente de IA só fala de produtos que recebeu, com os números vindos dos dados (`buildProductContext`). O LLM (ou o mock) apenas transforma isso em texto. Se o provedor de IA cair, o agente responde com o rascunho local — **nunca quebra o usuário**.

### 4. Dinheiro auditável e idempotente
- Cada conversão gera um `Conversion` + lançamentos em `WalletEntry` (`commission`, `referral_bonus`, `subscription`, `payout`).
- `computeCommissionSplit` é pura → recálculo/reconciliação confiável.
- Postbacks de conversão (`/api/webhooks/conversion`) devem ser assinados e idempotentes por `externalOrderId` em produção.

## Fluxos principais

### Gerar e compartilhar um link
```
usuário → POST /api/links { productId }
           → MarketplaceService.getProduct(productId)      (dados do produto)
           → checa limite do plano (PLANS[plan].maxActiveLinks)
           → core.createAffiliateLink(...)                 (URL + wa.me + legenda)
           → DataStore.createLink(...)                     (persiste, único por code)
       ← { link }   → usuário compartilha /r/:code
       → GET /r/:code → registra clique → 302 para o marketplace (com params de afiliado)
```

### Registrar uma venda
```
marketplace → POST /api/webhooks/conversion { code, orderValueCents }
   → encontra o link pelo code
   → computeCommissionSplit(...)                        (bruto, taxa, líquido, indicação)
   → cria Conversion + WalletEntry(commission)
   → se houver indicador → WalletEntry(referral_bonus)
   → atualiza o link (conversões + ganhos) e o saldo do usuário
```

### Conversar com o Vira
```
POST /api/chat { message, history }
   → SalesAgent.resolveProducts(message)   (busca real no feed)
   → SalesAgent.buildDraft(...)            (rascunho ancorado nos dados)
   → AiProvider.complete(...)              (mock ou LLM real)
   → se pediu link → createLinkForUser(...) → devolve link + legenda
```

### WhatsApp
```
Meta → POST /api/whatsapp/webhook
   → parseInbound()  (normaliza mensagens)
   → upsertLead()    (opt-in registrado)
   → comandos: TOP / AJUDA / COMISSÃO, senão agente de IA
   → WhatsAppProvider.sendText(...)
```
Handshake de verificação: `GET /api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=...`.

## Dados (Prisma / Postgres)

`User · AffiliateLink · Conversion · WalletEntry · Subscription · Lead · ClickEvent`
(ver `packages/db/prisma/schema.prisma`). Em dev não há banco: o `MemoryStore` é
semeado por `createSeededStore()`. Para produção, defina `DATABASE_URL`, rode
`prisma migrate` e troque `getStore()` por `new PrismaStore(prisma)` em
`apps/web/src/lib/store.ts`.

## Segurança

- Sessão por **cookie assinado (HMAC-SHA256)** no web; **Bearer token** no mobile
  (`authenticate(request)` aceita os dois).
- `APP_SECRET` assina sessão/links — trocar em produção.
- Webhooks de WhatsApp e de conversão precisam verificar assinatura/`verify_token`.
- Segredos só no servidor; o cliente fala apenas com `/api/*`.

## Performance

- `MarketplaceService` tem **cache TTL de 60s** por consulta.
- Feed agrega os 3 marketplaces em paralelo e ranqueia no `core`.
- Next.js com Turbopack (dev/build) e rotas de API dinâmicas.

## Por que essas escolhas

- **TypeScript ponta-a-ponta** → compartilhar o `core` entre web e mobile de graça.
- **Expo** → um código para Android **e** iOS, sem duas bases nativas.
- **Adapters + mock** → dá pra demonstrar e testar tudo hoje, e ligar produção
  depois sem reescrita.
- **Turbopack** → o caminho do projeto contém `!`, que o Webpack rejeita.
