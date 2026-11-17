# Arquitetura do Sistema — CAMBLU

## Visão Geral

O portal utiliza uma arquitetura **100% Firebase** (Opção A), unificando entrega de estáticos via CDN, autenticação, banco NoSQL em tempo real, armazenamento de arquivos e backend serverless seguro:

1. **Firebase Hosting:** serve o bundle otimizado gerado em `dist/` com cache inteligente e HTTPS automático para `camblu.org`.
   - Rotas `/eventos/:slug` passam pela Cloud Function `eventSocialPreview` para injetar meta tags OpenGraph (`og:title`, `og:description`, `og:image`) específicas de cada evento antes de entregar a SPA.
   - Rotas `/api/**` são encaminhadas para a Cloud Function HTTP `api`.
   - Demais rotas retornam `/index.html` (Client-Side Routing).
2. **Firebase Authentication:** login exclusivo via provedor **Google**. Contas com e-mail `camblufurb@gmail.com` recebem acesso administrativo ao painel `/back`.
3. **Cloud Firestore (Edição Standard):**
   - `users/{uid}` — cadastro acadêmico (Nome, CPF, e-mail, celular, vínculo FURB/turma ou Externo, calouro + tamanho camiseta) e metadados do Clube.
   - `events/{eventId}` — eventos, capacidade, modo presencial/virtual, localização Maps, lotes e configuração dos QR Codes (data/hora e horas de certificado) + mapeamento do template PNG de certificado.
   - `tickets/{ticketId}` — ingressos comprados/concedidos, lista de QR Codes individuais, marcações de presença (`checkedInAt`) e histórico de transferência via CPF.
   - `certificates/{certId}` — certificados emitidos após validação de presença, com código público verificável.
   - `products/{productId}` — produtos da Lojinha (fotos, preço, descrição, estoque por tamanho).
   - `orders/{orderId}` — pedidos da Lojinha (Stripe ou vendas externas/doações), status de pagamento e checklist de entrega.
   - `memberships/{uid}` — assinaturas do Clube CAMBLU (`comum`, `raro`, `epico`, `lendario`, ciclo `mensal`/`semestral`, status e `validUntil`).
   - `transparencyEntries/{entryId}` & `transparencyMeta/config` — movimentações financeiras mensais/SECIMED, investimentos (somente cálculo de saldo no `/back`) e link das Atas de Reunião.
   - `editais/{editalId}`, `anais/{anaisId}`, `gestoes/{gestaoId}`, `ligas/{ligaId}`, `demands/{demandId}`, `settings/public` — coleções institucionais.
4. **Firebase Storage:** armazena capas de eventos, imagens de produtos, templates PNG de certificados, PDFs de editais e anais da SECIMED e fotos 1:1 recortadas dos membros da gestão.
5. **Cloud Functions v2 (Node 22 + TypeScript):**
   - Criação segura de sessões **Stripe Checkout** (Cartão, PIX, Google Pay, Apple Pay) aplicando descontos/isenções do Clube no servidor e mantendo as taxas absorvidas pelo CAMBLU.
   - Processamento de **Webhooks Stripe** para confirmação atômica de ingressos, baixa de estoque e ativação/renovação de assinaturas.
   - **API aberta do Clube CAMBLU (`GET /api/clube/status`)** com resposta mínima `{ active, tier, validUntil }`.
   - Envio transacional de e-mails de demandas/CAMBLU Mulher para `camblufurb@gmail.com`.
   - Transferência atômica de ingressos por CPF e check-in de QR Codes.

## Renderização de Certificados (PDF e PNG)

No `/back`, a diretoria faz upload do **template PNG** exportado do Canva (recomendado A4 paisagem `3508×2480 px`) e posiciona visualmente os campos (`nome`, `cpf`, `evento`, `horas`, `data`, `codigo`, `qr`).

Na área do estudante (`/certificados`), o navegador combina o PNG base com as fontes e o QR de validação em Canvas de alta resolução para:
- Exportar em **PNG** de alta definição diretamente do Canvas;
- Exportar em **PDF** nativo via **`pdf-lib`**, pronto para validação de AACCs na FURB.
