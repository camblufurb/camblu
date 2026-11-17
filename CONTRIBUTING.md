# Guia de Contribuição — CAMBLU

Obrigado pelo interesse em contribuir com o portal oficial do **Centro Acadêmico de Medicina de Blumenau (CAMBLU - FURB)**!

## Princípios do Projeto

1. **Identidade Visual & Material Design 3:**
   - Utilize **Material Design 3 / Material You Expressive** com a paleta institucional (`#0f3325`, `#edd16e`, `#f1de97`) e azul de destaque `#3b82f7` nos controles interativos definidos nos tokens.
   - Tipografia obrigatória: **Roboto Flex**.
   - **Sem emojis Unicode na interface:** utilize exclusivamente **Material Symbols Rounded** (`<Icon name="..." />`) ou vetores SVG semânticos.
   - Toda animação de entrada e saída deve usar propriedades GPU (`transform`, `opacity`) e respeitar `@media (prefers-reduced-motion: reduce)`.
2. **Acessibilidade & Qualidade Web:**
   - HTML semântico (`<header>`, `<nav>`, `<main>`, `<footer>`, `<dialog>` nativo).
   - Contraste mínimo WCAG AA (4,5:1 para texto normal, 3:1 para elementos gráficos/foco).
   - Foco visível com `:focus-visible` e alvos clicáveis mínimos de `24×24 px` (recomendado `44×44 px`).
3. **Internacionalização (i18n):**
   - O arquivo de idiomas (`src/i18n/i18n.ts`) suporta exclusivamente **Português (`pt-BR`)** e **Inglês (`en-US`)**.
4. **Segurança (Regra Crítica):**
   - **Nunca** faça commit de arquivos `.env*`, chaves secretas do Stripe (`rk_live_*`, `sk_*`, `whsec_*`), senhas SMTP ou credenciais de serviço.

## Fluxo de Trabalho

1. Crie uma branch descritiva a partir da `main` (ex.: `feat/eventos-cupom`, `fix/validacao-cpf`).
2. Rode as verificações antes de abrir PR ou commitar:
   ```bash
   npm run typecheck
   npm run test
   npm run build
   ```
3. Use mensagens de commit claras em português ou Conventional Commits (`feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`).
4. Garanta que não haja regressões visuais em temas claro/escuro e mobile (`360px` a `1440px`).
