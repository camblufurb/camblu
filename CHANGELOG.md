# Histórico de Alterações (Changelog)

Todas as alterações relevantes do portal oficial do CAMBLU serão documentadas neste arquivo.

## [0.8.2] - 2026-11-17
### Alterado
- **Página MEDFURB (`/medfurb` — `src/pages/MedfurbPage.tsx`):** todo o conteúdo agora é renderizado de forma contínua na página (SAEME, Diretoria & Colegiado, Infraestrutura, Auxílio Estudantil, Estágios Optativos e TCC) com layout editorial em blocos alternados e faixa de marcos numéricos inspirados em `workspace.google.com/intl/pt-BR/industries/retail/`, enquanto as pills atuam como navegação por âncoras até cada seção (com `scroll-margin-top` global em `src/styles/base.css`).
- **Página de Detalhes do Evento (`/eventos/:slug` — `src/pages/EventDetailPage.tsx`):** removido o trecho `link (Social Preview)` do botão de compartilhamento (agora apenas `Compartilhar`) e da notificação de cópia, usando `navigator.share` com fallback para área de transferência.
- **Página de Detalhes do Produto (`/lojinha/:slug` — `src/pages/ProductDetailPage.tsx` e `src/context/ShopCartContext.tsx`):** removida a opção e persistência local de salvar produtos como favoritos.
- **Cabeçalho estilo Google Store (`src/components/Layout.tsx`, `src/components/PortalSearchDialog.tsx`, `src/components/AccountMenuButton.tsx`, `src/styles/components.css`):** integrado à página quando no topo (sem subtítulo, logo isolado à esquerda seguido pelos links e ícones utilitários à direita: Pesquisa rápida, Ajuda/Demandas, Sacola global e Conta), transformando-se suavemente em cápsula `pill` opaca ao rolar a página.
- **Painel `/back` multipágina (`src/pages/back/*`, `src/components/admin/AdminShell.tsx`, `src/components/admin/AdminEventShell.tsx`):** reorganizado em rotas dedicadas com abertura no Dashboard de estatísticas da Lojinha e do Clube CAMBLU (`/back`), páginas separadas na Lojinha (`/back/lojinha`, `/estoque`, `/produtos`, `/entregas`), página dedicada por evento (`/back/eventos/:eventId` com `/lotes`, `/participantes`, `/certificados` e `/qr`) e páginas individuais para Clube, Financeiro/Atas, Posts IG, Gestões, Editais, Anais, Ligas e Demandas.
- **Página Inicial (`src/pages/HomePage.tsx`), Instituições (`src/pages/InstituicoesPage.tsx`) e Cabeçalho (`src/components/InstitutionLogo.tsx`):** removidos os botões e o subtítulo `Medicina FURB · Representação discente desde 1990` do card de título principal, adicionada seção resumida das 4 instituições com link para `/medfurb/instituicoes`, padronizado o enquadramento/corte das logos (circular com preenchimento branco `#ffffff` na logo do CAMBLU e ajuste proporcional em AAARIH, DCE e IFMSA).
- **Clube CAMBLU (`/clube` — `src/pages/ClubPage.tsx`, `src/lib/clubPricing.ts`, `src/styles/components.css`):** página reformulada com destaque por raridade de níveis (`Comum`, `Raro`, `Épico` e `Lendário` com efeito shimmer GPU), listas cumulativas progressivas (`4 -> 6 -> 8 -> 10` benefícios), seletor de ciclo limpo e matriz comparativa completa lado a lado.
- **Rodapé e Manual do Calouro (`src/pages/ManualCalouroPage.tsx`, páginas públicas):** mantida a faixa de patrocinadores (`SponsorsStrip`) exclusivamente dentro do rodapé de `Layout.tsx` (eliminando duplicações no final das páginas) e redesenhado o Manual do Calouro com layout editorial inspirado em Google Build Your Future, barra de progresso interativa e capítulos assimétricos.
- **Leitor de QR Code por CPF (`/back/eventos/:eventId/qr` — `src/pages/back/AdminEventQrPage.tsx`):** substituída a digitação manual do código do ingresso pela busca por CPF, exibindo todos os ingressos e sessões do participante no evento para confirmação imediata.
- **Páginas de Histórico de Compras (`src/pages/MyTicketsHistoryPage.tsx`, `src/pages/MyShopOrdersPage.tsx`, `src/pages/back/AdminTicketPurchasesHistoryPage.tsx`, `src/pages/back/AdminShopOrdersHistoryPage.tsx`):** histórico completo de compras de ingressos e pedidos da Lojinha tanto na conta do usuário (`/meus-ingressos/historico`, `/meus-pedidos`) quanto no painel `/back` (`/back/eventos/historico`, `/back/lojinha/historico`), com leitura filtrada no Firestore para usuários autenticados (`src/context/AppDataContext.tsx`).

## [0.8.1] - 2026-11-17
### Corrigido & Aprimorado
- Restaurada herança global `box-sizing: inherit` em `src/styles/reset.css` e aplicados `min-inline-size: 0` / `max-inline-size: 100%` / `overflow-wrap: anywhere` em `.m3-btn`, `.m3-card` e grades responsivas, corrigindo o overflow horizontal nos botões de Instagram das Ligas e formulários.
- Aplicadas molduras M3 Expressive variáveis (`ExpressiveShapeFrame` com `fit="logo"` e recorte seguro em `#ffffff` sem cortar letras das bordas, além de morphing no hover conforme `m3.material.io/styles/shape/overview-principles`) em todas as 35 ligas acadêmicas em `src/pages/LigasPage.tsx`.

## [0.8.0] - 2026-11-17
### Adicionado
- Importação local e otimização em WebP das 31 fotos oficiais de integrantes das gestões em `public/gestoes/2024/*.webp` (`22` membros) e `public/gestoes/2026/*.webp` (`9` membros), vinculadas em `src/data/gestoes.ts` com enquadramento facial superior no `ExpressiveShapeFrame`.
- **Página Dedicada de Instituições Estudantis (`/medfurb/instituicoes`)** (`src/pages/InstituicoesPage.tsx`) com conteúdo completo sobre **CAMBLU**, **DCE FURB**, **AAARIH** e os 7 núcleos da **IFMSA Brazil FURB**, utilizando as logos oficiais (`assets/logos/`).
- **Documentação técnica da API do Clube CAMBLU** transferida exclusivamente para o repositório em [docs/CLUBE_API.md](docs/CLUBE_API.md).

### Alterado
- **Redesign do Index (`/` — `src/pages/HomePage.tsx`):** transformado em portal de apresentação resumida com hero editorial, pilares principais, carrossel Hero + Multi-browse, seletor interativo por momento acadêmico e acordeões de dúvidas frequentes com links diretos para todas as páginas.
- **Sistema de Animações M3 Expressive (`src/styles/motion.css`) e Carrosséis (`src/components/M3Carousel.tsx`):** adoção de curvas Spatial vs Effects, animações distintas por contexto (hero assimétrico com contra-rotação do brasão, entradas laterais *scroll-driven* via `animation-timeline: view()`, cascata em cards e setas direcionais), além de variantes `hero` e `multi-browse` com escala dinâmica inline no carrossel.
- Removido o bloco técnico de API de desenvolvedores de `ClubPage.tsx`, movidos checklists de deploy do proprietário para fora do Git e ajustados imports para `assets/logos/`.

## [0.7.1] - 2026-11-17
### Adicionado
- Importação local e otimização em WebP das 35 logos oficiais das **Ligas Acadêmicas** (`public/ligas/*.webp`) extraídas de `https://www.camblu.org/ligas-acadêmicas`, vinculadas em `src/data/ligas.ts` e exibidas com recorte limpo em `src/pages/LigasPage.tsx`.

### Alterado
- Limpeza editorial da interface pública em todo o portal (`HomePage`, `ShopPage`, `ProductDetailPage`, `LigasPage`, `EventsPage`, `ClubPage`, `AboutSpacesPage`, `SecimedPage` e demais páginas): removidos textos com termos técnicos/internos de implementação e reduzidas pills decorativas excessivas dentro dos blocos e cartões.

## [0.7.0] - 2026-11-17
### Adicionado
- **Páginas Individuais de Produto (`/lojinha/:slug`)** seguindo a referência Material Design 3 Expressive:
  - Galeria responsiva com empilhamento editorial no desktop e carrossel com swipe/peeking horizontal no mobile (`src/pages/ProductDetailPage.tsx`).
  - Seletor de tamanhos em chips M3, seletor de cores/edições em swatches arredondados, CTA principal `#3b82f7`, botão de favoritos persistente e compartilhamento.
  - Acordeões acessíveis (`<details>` + `::details-content` animados) para *Mais detalhes* e *Retirada na FURB, Trocas & Pagamento*.
  - Sacola compartilhada (`src/context/ShopCartContext.tsx`), barra flutuante da sacola (`src/components/FloatingCartPill.tsx`) com animação GPU de entrada/saída e diálogo de checkout Stripe unificado (`src/components/ShopCartDialog.tsx`).
  - Suporte administrativo no `/back` (`AdminShopTab.tsx`) para slug automático, múltiplas fotos de galeria e especificações técnicas por linha.

## [0.6.3] - 2026-11-17
### Alterado
- Padronização tipográfica global em `src/styles/tokens.css`, `src/styles/base.css` e 28 componentes/páginas (`h1`, `h2`, `h3` e `p`), garantindo exatamente o mesmo tamanho de fonte (`--font-size-h1`, `--font-size-h2`, `--font-size-h3`, `--font-size-p`) por tipo semântico em todo o portal, além da adição de `<meta name="text-scale" content="scale" />` no `index.html`.

## [0.6.2] - 2026-11-17
### Adicionado
- Integração das logos oficiais reais em `assets/img/`: brasões do CAMBLU (`logo_color.png` e `logo_clean.png` como favicon, OpenGraph, cabeçalho, hero e rodapé) e logotipos oficiais dos patrocinadores (**Unicred**, **Fruki Bebidas** e **Balsaneli Contabilidade**) no `SponsorsStrip`.

## [0.6.1] - 2026-11-17
### Alterado
- Removido o alternador de idioma (mantendo o portal 100% em Português Brasileiro `pt-BR`).
- Removido o alternador e tokens de modo noturno (mantendo o portal exclusivamente no tema claro).

## [0.6.0] - 2026-11-16 (Etapa 6)
### Adicionado
- Configuração completa do Firebase (`firebase.json`, `.firebaserc`, `firestore.rules`, `firestore.indexes.json`, `storage.rules`).
- Isolamento de saldo financeiro privado em `transparencyMeta/config` (restrito ao `/back`) vs `transparencyMeta/public` (link público das atas).
- Backend serverless **Cloud Functions v2 (`functions/`)**:
  - Sessões **Stripe Checkout** (Cartão, PIX, Google Pay, Apple Pay) com taxas absorvidas e cálculo server-side do Clube CAMBLU.
  - Webhook assinado Stripe para emissão atômica de ingressos/QR codes, baixa de estoque na Lojinha e ativação/cancelamento de assinaturas.
  - API aberta `/api/clube/status`, transferência atômica de ingressos via CPF, check-in administrativo de QR codes, verificação pública mascarada de certificados e envio de demandas para `camblufurb@gmail.com`.
  - Função `eventSocialPreview` para OpenGraph dinâmico em `/eventos/:slug`.
- Workflows GitHub Actions (`ci.yml` e `firebase-deploy.yml`).

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
