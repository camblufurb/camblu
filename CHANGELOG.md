# Histórico de Alterações (Changelog)

Todas as alterações relevantes do portal oficial do CAMBLU serão documentadas neste arquivo.

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
