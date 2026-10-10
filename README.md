# ⚡ Viraliza

**Venda automática dos produtos mais virais do Mercado Livre, Shopee e Amazon — com agente de IA, WhatsApp e comissões.**

Viraliza é uma plataforma de marketing de afiliados 100% automatizada para o Brasil. Ela:

1. 🔥 **Descobre** os produtos mais virais / mais vendidos / mais desejados dos 3 maiores marketplaces.
2. 🤖 **Gera** links de afiliado rastreáveis em 1 toque (e um agente de IA que faz isso conversando).
3. 📲 **Compartilha** em qualquer lugar — WhatsApp, Instagram, TikTok, Telegram — com texto pronto.
4. 💸 **Paga comissão** ao usuário a cada venda, ficando com uma taxa de serviço como receita.
5. 🔁 **Escala** com assinatura mensal ou pagamento único.

> **Web** (Next.js) + **Android/iOS** (Expo/React Native) + **API** + **banco** + **agente de IA** + **WhatsApp** + **marketplaces** — tudo em um monorepo TypeScript.

---

## 🚀 Começando (5 minutos, zero configuração)

Requisitos: **Node.js ≥ 20** (testado no 24) e npm.

```bash
npm install          # instala tudo (workspaces)
npm run dev          # sobe o web + API em http://localhost:3000
```

Pronto. **Tudo roda em "modo demo"** sem nenhuma chave:

- Catálogo de exemplo realista do Mercado Livre, Shopee e Amazon.
- Agente de IA determinístico (sem custo de API).
- WhatsApp em modo "outbox" (mensagens ficam registradas, não são enviadas).
- Banco em memória, já populado com uma conta de demonstração.

### Entrar na demonstração

Abra <http://localhost:3000> → **Entrar** → **Usar conta de demonstração**.
Login: `demo@viraliza.app` (já vem com 6 links e comissões).

### App mobile (Android / iOS)

```bash
npm run dev:mobile   # abre o Expo
# depois: tecle "a" (Android) ou "i" (iOS), ou leia o QR no app Expo Go
```

No celular físico, aponte para o IP da sua máquina:

```bash
EXPO_PUBLIC_API_URL=http://SEU_IP_LOCAL:3000 npm run dev:mobile
```

---

## 🧱 Estrutura do monorepo

```
automatic-viral-sales/
├─ apps/
│  ├─ web/            # Next.js: site, painel, IA, API e webhooks
│  └─ mobile/         # Expo (React Native): app Android + iOS
├─ packages/
│  ├─ core/           # ⭐ tipos, motor de comissão, score viral, gerador de links
│  ├─ marketplaces/   # adapters Mercado Livre / Shopee / Amazon (+ catálogo demo)
│  ├─ ai/             # agente de vendas "Vira" (provider mock / OpenAI / Azure)
│  ├─ whatsapp/       # provider mock / Meta Cloud API + webhook + templates
│  └─ db/             # schema Prisma + store em memória + seed
├─ scripts/smoke.ps1  # teste ponta-a-ponta do fluxo de comissão
└─ docs/              # modelo de negócio, integrações, roadmap
```

O **`packages/core`** é o cérebro compartilhado: as mesmas regras de comissão, ranking
viral e construção de links valem para web, mobile e API.

---

## 🧠 Como funciona a comissão

```
Venda de R$ 100 na Shopee (comissão 14%)
   → Comissão bruta da loja:        R$ 14,00
   → Taxa da Viraliza (20%):        R$  2,80   ← nossa receita
   → Usuário recebe (líquido):      R$ 11,20
   → Bônus de indicação (5%):       R$  0,56   ← para quem convidou
```

- A taxa da Viraliza cai conforme o plano: **Grátis 20% · Pro 15% · Business 10%**.
- Tudo auditável em `packages/core/src/commission.ts` (função pura e testada).
- Detalhes e números em [`docs/BUSINESS-MODEL.md`](docs/BUSINESS-MODEL.md).

---

## 💳 Planos

| Plano | Preço | Taxa Viraliza | Destaques |
|---|---|---|---|
| **Grátis** | R$ 0 | 20% | 5 links, agente de IA limitado |
| **Pro** | R$ 29,90/mês | 15% | Links ilimitados, broadcast WhatsApp, prioridade no feed |
| **Business** | R$ 99,90/mês | 10% | Equipe, relatórios, API de afiliados |
| **Pro Vitalício** | R$ 199,00 (único) | 15% | Pro para sempre |

---

## 🔌 Ligando o modo real (produção)

Tudo começa em **modo demo**. Para virar ao vivo, copie `.env.example` para `.env`
e preencha as chaves que você tiver — cada integração troca de mock para real
**sem mudar uma linha de código**:

```bash
cp .env.example .env
# edite: MARKETPLACE_MODE=live, AI_PROVIDER=openai, WHATSAPP_PROVIDER=cloud, DATABASE_URL=...
```

Guia passo a passo: [`docs/INTEGRATIONS.md`](docs/INTEGRATIONS.md).

---

## 🛠️ Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Web + API em `localhost:3000` |
| `npm run dev:mobile` | Expo (Android/iOS) |
| `npm run build` | Build de produção do web |
| `npm run typecheck` | Checa tipos de todos os workspaces |
| `npm run test` | Roda os testes (motor de comissão, links, feed, agente) |
| `npm run db:seed` | Popula o store de demonstração |
| `npm run db:generate` | Gera o Prisma Client (com `DATABASE_URL`) |

Teste ponta-a-ponta (com o `npm run dev` rodando):

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\smoke.ps1
```

---

## 🧪 Qualidade

- **24 testes** cobrindo comissão, link building, score viral, feed e agente de IA.
- **Typecheck estrito** em todos os packages.
- Arquitetura por **adapters**: mock ↔ real, memória ↔ Postgres, sem reescrever nada.

---

## ⚠️ Observações importantes

- **Comissões são estimativas** baseadas em dados públicos; nunca prometemos renda garantida.
- **WhatsApp**: mensagens iniciadas pela empresa exigem *opt-in* e templates aprovados pela Meta.
  A Viraliza só envia para números que optaram (conversa no bot). Envio em massa não solicitado
  viola as políticas do WhatsApp.
- **Nome do projeto**: "**Viraliza**" é um nome de trabalho. Troque à vontade em
  `package.json`, `app.json` e nos componentes `Logo`.
- **Caminho com `!`**: o Webpack não aceita `!` no caminho do projeto, por isso o web usa
  **Turbopack** (`next dev --turbopack`). Se mover o projeto para um caminho sem `!`, o
  webpack também funcionará.
- **`@types/react` fixado em `19.0.14`**: o React Native 0.79 é incompatível com
  `@types/react ≥ 19.1` (mudança do `ReactPortal`). O monorepo fixa uma única versão
  (via `devDependencies` + `overrides` na raiz). Se subir o RN, pode desafixar.

---

## 📄 Documentação

- [`ARCHITECTURE.md`](ARCHITECTURE.md) — desenho do sistema e decisões.
- [`docs/BUSINESS-MODEL.md`](docs/BUSINESS-MODEL.md) — economia, planos e unit economics.
- [`docs/INTEGRATIONS.md`](docs/INTEGRATIONS.md) — conectar marketplaces, IA e WhatsApp.
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — fases de produto.
