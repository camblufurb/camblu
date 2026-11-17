# Referência de Infraestrutura — Firebase & Pagamentos

Especificação técnica dos serviços em nuvem utilizados pela plataforma do CAMBLU.

## Projeto e Regiões

- **Hosting & CDN:** SPA servida via Firebase Hosting com roteamento dinâmico de previews OpenGraph (`/eventos/:slug`) via `eventSocialPreview` e encaminhamento `/api/**` para a Cloud Function `api`.
- **Authentication:** provedor Google Sign-In associado aos domínios autorizados de produção (`camblu.org`, `www.camblu.org`, `camblu.web.app`).
- **Cloud Firestore:** banco padrão na edição **Standard** em `southamerica-east1` (São Paulo), protegido por [firestore.rules](../firestore.rules) e indexado em [firestore.indexes.json](../firestore.indexes.json).
- **Cloud Storage:** bucket padrão na região `southamerica-east1`, protegido por [storage.rules](../storage.rules).

## Variáveis e Segredos

- **Variáveis públicas de frontend (`.env.local`):** definidas em [.env.example](../.env.example) (`VITE_FIREBASE_*` e `VITE_STRIPE_PUBLISHABLE_KEY`).
- **Segredos serverless (Secret Manager):**
  - `STRIPE_RESTRICTED_KEY` — chave restrita para criação de sessões Checkout.
  - `STRIPE_WEBHOOK_SECRET` — validação de assinatura do webhook em `/api/stripe/webhook`.
  - `SMTP_PASS` — credencial transacional para despacho de demandas.

## Eventos de Webhook

O endpoint `POST /api/stripe/webhook` processa:
- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
