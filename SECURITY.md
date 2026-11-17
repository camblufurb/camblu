# Política de Segurança

## Reportando Vulnerabilidades

Se você identificar qualquer vulnerabilidade de segurança, exposição acidental de dados pessoais ou falha nas regras do Firestore/Storage, **não abra uma issue pública**.

Entre em contato diretamente com a diretoria responsável pelo e-mail:
- **E-mail oficial:** `camblufurb@gmail.com` (Assunto: `[SEGURANÇA] Descrição resumida`)

Responderemos o mais rápido possível para coordenar a correção antes da divulgação.

---

## Boas Práticas Implementadas neste Repositório

1. **Segredos e Chaves de API:**
   - A chave restrita do Stripe (`STRIPE_RESTRICTED_KEY`), o segredo de webhook (`STRIPE_WEBHOOK_SECRET`) e credenciais SMTP residem exclusivamente no **Google Cloud Secret Manager** utilizado pelas Cloud Functions v2.
   - Apenas chaves públicas (`pk_live_*` do Stripe e configuração pública do Web App Firebase) ficam no cliente.
2. **Controle de Acesso (RBAC):**
   - Acesso ao painel administrativo (`/back`) e operações privilegiadas exigem token Firebase Auth verificado com e-mail institucional autorizado (`camblufurb@gmail.com`).
   - Regras de `firestore.rules` e `storage.rules` validam tipos, tamanhos de campos, imutabilidade de autoria e impedem auto-escalação de privilégios.
3. **Privacidade & LGPD:**
   - Dados pessoais (CPF, telefone, e-mail) na coleção `users/{uid}` são legíveis apenas pelo próprio titular e pelo administrador.
   - A API pública do Clube CAMBLU (`/api/clube/status`) recebe CPF ou e-mail como filtro de entrada e retorna **exclusivamente** `{ active, tier, validUntil }`, nunca expondo dados cadastrais na resposta.
   - O saldo financeiro atual nunca é exposto na interface pública da Transparência, ficando restrito ao painel administrativo.
