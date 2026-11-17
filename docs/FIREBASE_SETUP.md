# Guia de Configuração — Firebase & Stripe (`camblu`)

Projeto Firebase oficial: **`camblu`** (Project Number: `830416621306`), sob propriedade de `camblufurb@gmail.com`.

## 1. Serviços para ativar no Firebase Console

1. **Plano Blaze (Faturamento):**
   - Faça o upgrade do projeto `camblu` para o plano **Blaze** (necessário para Cloud Functions v2 e Secret Manager).
   - Cadastre um **Alerta de Orçamento** (ex.: R$ 10,00/mês) no Google Cloud Billing.
2. **Authentication:**
   - Ative o provedor **Google** com e-mail de suporte `camblufurb@gmail.com`.
   - Em *Configurações → Domínios autorizados*, garanta `localhost`, `camblu.web.app`, `camblu.firebaseapp.com`, `camblu.org` e `www.camblu.org`.
3. **Cloud Firestore:**
   - Crie o banco padrão na edição **Standard** e região **`southamerica-east1` (São Paulo)**.
4. **Storage:**
   - Inicialize o bucket padrão em **`southamerica-east1`**.
5. **Aplicativo Web:**
   - Em *Configurações do projeto → Seus apps*, registre um app Web (`CAMBLU Web`) e copie `apiKey` e `appId` para `.env.local` (ou obtenha via `npx -y firebase-tools@latest apps:sdkconfig WEB`).

## 2. Segredos no Backend (Secret Manager)

**Nunca** coloque chaves secretas no repositório ou no `.env` do frontend. Configure-os via CLI após ativar o Blaze:

```bash
# Chave restrita do Stripe (NUNCA commitar!)
npx -y firebase-tools@latest functions:secrets:set STRIPE_RESTRICTED_KEY --project camblu

# Segredo do Webhook obtido no Dashboard do Stripe ao cadastrar https://camblu.org/api/stripe/webhook
npx -y firebase-tools@latest functions:secrets:set STRIPE_WEBHOOK_SECRET --project camblu

# Senha de App do Gmail (camblufurb@gmail.com) ou chave SMTP para envio de demandas por e-mail
npx -y firebase-tools@latest functions:secrets:set SMTP_PASS --project camblu
```

## 3. Webhook no Stripe

No Dashboard do Stripe (*Developers → Webhooks → Add endpoint*):
- **URL:** `https://camblu.org/api/stripe/webhook` (ou URL da função publicada)
- **Eventos recomendados:**
  - `checkout.session.completed`
  - `checkout.session.async_payment_succeeded` (essencial para confirmação assíncrona do **PIX**)
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`

## 4. Deploy completo

```bash
# Compilar frontend e functions
npm run build
npm --prefix functions run build

# Publicar regras, índices, hosting e functions
npx -y firebase-tools@latest deploy --project camblu
```
