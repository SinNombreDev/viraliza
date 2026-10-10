# Integrações — como ligar o modo real

Tudo já está implementado com **adapters**. O modo demo é o padrão; para ir ao
vivo, copie `.env.example` para `.env` e preencha o que tiver. Nenhuma linha de
código muda.

```bash
cp .env.example .env
```

---

## 1. Mercado Livre (Afiliados)

**Adapter:** `packages/marketplaces/src/adapters/mercadolivre.ts`

1. Crie uma conta em <https://www.mercadolivre.com.br/afiliados>.
2. Gere um App no <https://developers.mercadolivre.com.br/> (OAuth).
3. Preencha:
   ```env
   ML_APP_ID=...
   ML_CLIENT_SECRET=...
   ML_AFFILIATE_ID=...        # seu id de afiliado
   ML_ACCESS_TOKEN=...        # token OAuth (renove periodicamente)
   ```
4. Ative o modo real:
   ```env
   MARKETPLACE_MODE=live
   ```
   > Se as credenciais de um marketplace faltarem, a Viraliza usa o mock **só
   > para ele** e mantém os demais reais.

A Viraliza usa a API de busca pública para metadados e a API de Afiliados para
gerar o link rastreado (`mintAffiliateLink`).

---

## 2. Shopee (Affiliate Open API)

**Adapter:** `packages/marketplaces/src/adapters/shopee.ts`

1. Entre no programa: <https://affiliate.shopee.com.br/>.
2. Peça acesso à **Open API** e obtenha `appId` e `appSecret`.
3. Preencha:
   ```env
   SHOPEE_APP_ID=...
   SHOPEE_APP_SECRET=...
   SHOPEE_AFFILIATE_ID=...
   ```
4. `MARKETPLACE_MODE=live`.

Assinatura das requisições: `sha256(appId + timestamp + payload + appSecret)`,
enviada no header `Authorization`. A API é GraphQL (`productOfferV2`,
`generateShortLink`). Dica: use `subId` = `userId-linkCode` para atribuir a venda.

---

## 3. Amazon (Associates / PA-API 5)

**Adapter:** `packages/marketplaces/src/adapters/amazon.ts`

1. Crie a conta em <https://associados.amazon.com.br/>.
2. A PA-API só libera após suas **3 primeiras vendas qualificadas**.
3. Gere Access Key / Secret Key e pegue seu **Partner Tag** (ex.: `seutag-20`).
4. Preencha:
   ```env
   AMAZON_ACCESS_KEY=...
   AMAZON_SECRET_KEY=...
   AMAZON_PARTNER_TAG=seutag-20
   AMAZON_REGION=com.br
   ```
5. `MARKETPLACE_MODE=live`.

O adapter assina com **AWS SigV4** (`SearchItems`, `GetItems`, `GetBestSellers`)
no host `webservices.amazon.com.br`. A Amazon não tem API de "gerar link": o link
rastreado é a URL do produto + `tag` + `ascsubtag`.

---

## 4. Agente de IA

**Provider:** `packages/ai/src/openai-provider.ts`

```env
AI_PROVIDER=openai          # ou azure-openai
AI_MODEL=gpt-4o-mini
OPENAI_API_KEY=sk-...
```

Azure:

```env
AI_PROVIDER=azure-openai
AZURE_OPENAI_ENDPOINT=https://SEU-RECURSO.openai.azure.com
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini
```

Sem chave, continua no `MockAiProvider` (determinístico, custo zero). O agente
sempre é "ancorado" nos dados reais do catálogo, então o LLM não inventa números.

---

## 5. WhatsApp (Meta Cloud API)

**Provider:** `packages/whatsapp/src/cloud.ts`

1. Crie um app no <https://developers.facebook.com/> e adicione o produto WhatsApp.
2. Pegue o **Phone Number ID**, **Access Token** e o **Business Account ID**.
3. Preencha:
   ```env
   WHATSAPP_PROVIDER=cloud
   WHATSAPP_PHONE_NUMBER_ID=...
   WHATSAPP_ACCESS_TOKEN=...
   WHATSAPP_VERIFY_TOKEN=um-token-secreto
   WHATSAPP_BUSINESS_ACCOUNT_ID=...
   ```
4. Configure o webhook apontando para `https://SEU_DOMINIO/api/whatsapp/webhook`
   (o handshake `GET` já é tratado) e assine o evento `messages`.
5. Crie os **templates** aprovados (ex.: `oferta_diaria`) para mensagens
   iniciadas pela empresa.

> ⚠️ **Política**: só envie para quem deu opt-in. O bot registra `Lead.optedIn`.
> Envio em massa não solicitado derruba o número.

---

## 6. Banco de dados (produção)

```env
DATABASE_URL=postgresql://user:pass@host:5432/viraliza
```

```bash
npx prisma migrate dev --name init   # dentro de packages/db
npx prisma generate
```

Depois, em `apps/web/src/lib/store.ts`, troque o `MemoryStore` pelo `PrismaStore`
(classe já pronta em `packages/db/src/prisma-store.ts`).

---

## 7. Pagamentos (assinatura)

- **Stripe** (cartão/recorrente): preencha `STRIPE_SECRET_KEY` e
  `STRIPE_WEBHOOK_SECRET`; o endpoint `/api/subscribe` é onde você criaria a
  Checkout Session e o webhook fliparia o plano.
- **PIX** (Brasil, pagamento único): preencha `PIX_KEY`; gere a cobrança no
  endpoint de assinatura e confirme por webhook do seu provedor PIX.

Hoje o `/api/subscribe` aplica o plano instantaneamente (modo demo) para o fluxo
ser testável de ponta a ponta.

---

## Checklist para produção

- [ ] `.env` preenchido e **`APP_SECRET` forte** (assina sessão/links).
- [ ] `MARKETPLACE_MODE=live` com as credenciais das lojas.
- [ ] `DATABASE_URL` + `prisma migrate` + `PrismaStore`.
- [ ] `AI_PROVIDER` real (ou mantenha mock para reduzir custo).
- [ ] WhatsApp Cloud + templates + webhook verificado.
- [ ] Stripe/PIX para cobrança de assinatura.
- [ ] Postbacks de conversão assinados e idempotentes.
- [ ] Domínio + HTTPS (obrigatório para WhatsApp).
- [ ] Monitoramento de conversões e antifraude.
