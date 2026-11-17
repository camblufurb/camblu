# Histórico de Alterações (Changelog)

Todas as alterações relevantes do portal oficial do CAMBLU serão documentadas neste arquivo.

## [0.5.0] - 2026-11-16 (Etapa 5)
### Adicionado
- **Painel Administrativo (`/back`)** exclusivo para `camblufurb@gmail.com`:
  - Gestão de eventos (presencial/virtual, lotes, múltiplos QR codes e carga horária), **leitor QR via câmera (`html5-qrcode`)** com emissão automática de certificados e **editor visual de template PNG (Canva)**.
  - Gestão da **Lojinha**, lançamento de doações/vendas externas no estoque e **checklist de entregas com link `wa.me/55...`**.
  - **Planilha de Transparência** com autocomplete de categorias, **Saldo Atual/Projetado/Investido restrito ao `/back`**, edição do link Drive das atas e **exportador das 4 imagens 1080×1350 PNG** para o post mensal de transparência.
  - Gestão do histórico de gestões com **cortador 1:1 integrado** e dropdown de cargos, além de CRUD de Editais, Anais SECIMED, Ligas Acadêmicas e log de Demandas.

## [0.4.0] - 2026-11-16 (Etapa 4)
### Adicionado
- **Lojinha (`/lojinha`)**: catálogo com tamanhos e controle de estoque, sacola interativa, 10% automático do Clube e checkout Stripe (PIX, Cartão, Apple/Google Pay).
- **Clube CAMBLU (`/clube` e `/clube/cartao`)**: planos Comum, Raro, Épico e Lendário (com shimmer), cartão digital reativo ao giroscópio (`DeviceOrientation`) e API aberta `/api/clube/status` com testador integrado.
- **Transparência (`/transparencia`)**: gráficos de entradas × saídas por mês, despesas por categoria, heatmap anual, listagem auditável (mantendo o saldo atual restrito ao `/back`) e botão das Atas de Reunião no Drive.
- **Calendário (`/calendario`)**, **Editais (`/editais`)**, **Demandas (`/demandas`)** com seleção de assunto para `camblufurb@gmail.com` e **CAMBLU Mulher (`/camblu-mulher`)**.

## [0.3.0] - 2026-11-16 (Etapa 3)
### Adicionado
- Catálogo e páginas individuais de Eventos (`/eventos`, `/eventos/:slug`) com múltiplos lotes, modo presencial/virtual, cálculo automático de descontos/isenções do Clube CAMBLU e preparo para Social Preview dinâmico.
- Área de Ingressos (`/meus-ingressos`) com QR Codes individuais por sessão e sistema de transferência de ingresso entre contas usando CPF.
- Renderizador e exportador de Certificados (`certificateRenderer.ts`) em alta resolução sobre template PNG (Canva), com download em **PDF (`pdf-lib`)** e **PNG** + validação pública (`/certificados/validar/:codigo`).
- Páginas oficiais da **SECIMED** (`/secimed`) e repositório dos **Anais SECIMED** (`/secimed/anais-secimed`, ISSN 3086-612X, CC BY-NC 4.0, Zenodo).

## [0.2.0] - 2026-11-16 (Etapa 2)
### Adicionado
- `AuthContext` com autenticação Google + modo demonstração local e onboarding completo (Nome, CPF validado, celular, vínculo FURB/turma numérica ou Externo, calouro + tamanho de camiseta).
- `AppDataContext` com sincronização Firestore + fallback local e geração integral de dados reais (`transparencySeed.ts` com 112 lançamentos da planilha, 35 ligas acadêmicas, gestões 2024/2026 e Manual do Calouro 2026).
- Páginas públicas institucionais completas: Home (`/`), Perfil (`/perfil`), Sobre & Espaços (`/sobre`, `/espacos`), MEDFURB (`/medfurb`), Catálogo de Ligas (`/ligas`), Histórico de Gestões (`/gestoes` com formas M3 animadas) e Manual do Calouro (`/manual-do-calouro`).
- Suíte de testes unitários para cálculo de descontos/isenções do Clube CAMBLU (`clubPricing.test.ts`).

## [0.1.0] - 2026-11-16 (Etapa 1)
### Adicionado
- Estrutura inicial do repositório com Vite + React 19 + TypeScript.
- Documentação completa do GitHub (`README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `docs/ARCHITECTURE.md`, `docs/FIREBASE_SETUP.md`).
- Sistema de design Material Design 3 / Material You Expressive (`Roboto Flex`, `Material Symbols Rounded`, paleta `#0f3325`, `#edd16e`, `#f1de97`, acento `#3b82f7`, tema claro/escuro automático e manual).
- Internacionalização `pt-BR` e `en-US` (`src/i18n/i18n.ts`).
- Componentes base acessíveis: `M3Carousel`, `M3Dialog`, `ExpressiveShapeFrame`, `ToastProvider`, `SponsorsStrip` (Unicred, Fruki, Balsaneli Contabilidade) e shell responsivo de navegação.
