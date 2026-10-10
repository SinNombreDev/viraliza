# Modelo de negócio — Viraliza

## Proposta de valor

Viraliza transforma qualquer pessoa com WhatsApp em um afiliado produtivo:
encontra os produtos que **já estão vendendo**, gera o link e escreve a mensagem.
O usuário só compartilha. O trabalho chato (descobrir produto, montar link,
escrever copy) é automático.

## Como a Viraliza ganha dinheiro

Três fontes de receita, em ordem de importância:

### 1. Taxa sobre a comissão (receita principal)

A Viraliza é a **afiliada oficial** de cada marketplace (uma conta só dela) e
distribui sub-IDs para os usuários. Quando uma venda acontece, a loja paga a
comissão à Viraliza, que fica com uma **taxa de serviço** e repassa o resto.

```
Venda R$ 100 · Shopee (comissão 14%)
  Comissão bruta        R$ 14,00
  Taxa Viraliza (20%)   R$  2,80   ⬅ receita
  Líquido p/ usuário    R$ 11,20
  Bônus indicador (5%)  R$  0,56   ⬅ custo de aquisição
  ─────────────────────────────
  Viraliza (líquido)    R$  2,24
```

O motor está em `packages/core/src/commission.ts`.

### 2. Assinaturas

| Plano | Preço | Taxa | Racional |
|---|---|---|---|
| Grátis | R$ 0 | 20% | Aquisição; usuário testa e vê comissão cair na conta |
| Pro | R$ 29,90/mês | 15% | Volume + automação de WhatsApp |
| Business | R$ 99,90/mês | 10% | Times/agências, API, relatórios |
| Pro Vitalício | R$ 199,00 único | 15% | Opção de pagamento único (sem recorrência) |

Receita recorrente dá previsibilidade; a taxa sobre comissão cresce com o sucesso do usuário.

### 3. Extras (futuro)

Destaque patrocinado no feed, relatórios premium, API para agências,
templates de WhatsApp prontos, "Viraliza para Lojistas" (loja anunciar produto).

## Unit economics (exemplo ilustrativo)

Premissas: comissão média 10% · ticket médio R$ 120 · conversão do link 2% · 6 cliques/usuário/dia.

- Comissão bruta por venda: **R$ 12,00**
- Receita Viraliza por venda (20%): **R$ 2,40**
- Um usuário ativo que gera 1 venda/dia ≈ **R$ 72/mês** de receita bruta de comissão
- Custo de IA (mock ≈ R$ 0; LLM real: frações de centavo por conversa)
- Custo de WhatsApp: conversas de serviço (a definir pela tarifa Meta)

Alavancas de margem: subir a taxa (planos), reduzir custo de IA (cache + modelo menor),
aumentar conversão do link (copy do agente).

## Aquisição (growth) — loop viral embutido

O **bônus de indicação** (5% do líquido do convidado) cria um loop: quem convida
ganha para sempre sobre as vendas do convidado. O mesmo mecanismo que gera receita
gera aquisição.

- Código de convite por usuário (`User.referralCode`).
- Bônus em `WalletEntry` tipo `referral_bonus`.
- Landing + WhatsApp bot já prontos para capturar e converter.

## Custos

- **Marketplaces**: R$ 0 (programas de afiliados são gratuitos para entrar).
- **IA**: R$ 0 em modo mock; em produção, centavos por conversa (usar modelo pequeno).
- **WhatsApp**: cobrança por conversa da Meta (custo operacional variável).
- **Infra**: 1 app Next.js + 1 Postgres (R$ baixo no início; escala horizontal depois).
- **Saque**: PIX (custo fixo baixo por transação).

## Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Loja reduz/corta comissão | Diversificação nos 3 marketplaces + feed dinâmico |
| Política do WhatsApp | Só mensagens opt-in + templates aprovados |
| Fraude de conversão | Webhooks assinados, idempotência por `externalOrderId`, revisão manual de picos |
| Dependência de LLM | Provider abstrato + fallback local (mock) sempre funciona |
| Churn de assinatura | Plano grátis funcional + taxa menor nos pagos |

## Métricas que importam

- **Links criados/usuário** → engajamento.
- **Cliques/link** e **conversão** → qualidade da copy do agente.
- **Comissão líquida/usuário** → valor entregue.
- **Taxa Viraliza realizada** (receita/volume) → saúde do modelo.
- **% de usuários com indicados** → força do loop viral.
