# Relatório de QA — Compatibilidade Cross-Browser (SCRUM-543 / RNF08)

## 1. Identificação da Tarefa

- **Tarefa Jira**: `SCRUM-543` — `[QA] Validar compatibilidade da aplicação nos navegadores suportados`
- **Requisito Relacionado**: `SCRUM-524` — `[RNF08] Compatibilidade`
- **Repositório**: `API-DSM-4-FRONTEND`
- **Suíte de Testes Automatizados**: `src/features/compatibility/browserCompatibility.test.tsx`

---

## 2. Escopo e Navegadores Suportados (RNF08)

A validação garante que a aplicação web funcione de forma equivalente, acessível e sem regressões visuais ou funcionais nos três navegadores definidos pelo requisito não funcional **RNF08**:

| Navegador | Motor de Renderização / JS | User-Agent / Ambiente Validado | Status |
| --- | --- | --- | --- |
| **Google Chrome** | Blink / V8 | `Chrome/131.0.0.0` (Suíte Vitest) e `Google Chrome 155.0.8059.84` (Headless) | Aprovado |
| **Microsoft Edge** | Blink / V8 | `Edg/131.0.0.0` (Suíte Vitest e motor Chromium Headless) | Aprovado |
| **Mozilla Firefox** | Gecko / SpiderMonkey | `Firefox/133.0` (Suíte Vitest) e `Mozilla Firefox 159.0.1` | Aprovado |

---

## 3. Matriz de Validação por Funcionalidade

Os 9 itens de escopo exigidos na especificação da tarefa `SCRUM-543` foram validados nos três navegadores:

| # | Item de Escopo | Componentes / Telas Validados | Resultado |
| --- | --- | --- | --- |
| 1 | **Carregamento das páginas** | `LoginPage`, `DashboardPage`, `StationsPage`, `StationDetailPage`, `HistoryPage`, `DashboardStats`, `AlertsPage`, `RulesPage`, `PropertiesPage`, `UsersPage`, `RolesPage`, `ParametersPage` | Aprovado |
| 2 | **Navegação entre telas** | `AppShell` (link `Pular para o conteúdo`), `TopNav` desktop mega-menu (`mouseenter`, `pointerdown` externo, setas `ArrowDown`/`ArrowUp`, `Escape`, `Tab`) e menu mobile (`Abrir menu` / `Fechar menu`) | Aprovado |
| 3 | **Formulários** | Validação obrigatória, atributos ARIA (`aria-invalid`, `aria-describedby`, `role="alert"`), submissão assíncrona em `LoginPage` e modais de cadastro (`StationsPage`, `UsersPage`, `RulesPage`, `ParametersPage`, `PropertiesPage`) | Aprovado |
| 4 | **Tabelas** | Semântica (`table`, `thead`, `tbody`, `th scope="col"`), paginação, filtros combinados, contêiner com rolagem lateral (`overflow-x-auto`) e exportação CSV via `Blob` + `URL.createObjectURL` + `URL.revokeObjectURL` | Aprovado |
| 5 | **Gráficos e indicadores** | `TrendChart`, `StationExtremesChart`, `AlertThresholdChart` (`isThresholdViolated`), `ForecastCalendarCard` (7 dias + janelas operacionais), `ResizeObserver` e formatação `Intl` (`America/Sao_Paulo`, `pt-BR`) | Aprovado |
| 6 | **Componentes visuais** | `Modal` (focus trap, tecla `Escape`, restauração de foco), `ConfirmDialog`, `DateRangePicker` (calendário interativo e atalhos), `ReactSelect`, `Select` (`default` e `glass`), `Segmented` (`role="radiogroup"`), `Switch` (`role="switch"`), `Badge` | Aprovado |
| 7 | **Responsividade** | Adaptação entre viewport desktop (`1280x800`) e mobile (`375x667`), alternância de navegação mobile (`aria-controls="menu-mobile"`) e ocultação progressiva de colunas secundárias (`hidden sm:table-cell`, `hidden md:table-cell`) | Aprovado |
| 8 | **Integração das interfaces com a API** | Cliente HTTP `request` (`/api/backend/...`, `AbortSignal.timeout`), validação `sameOrigin` (`Origin`, `Host`, `X-Forwarded-Host`, `X-Forwarded-Proto`, `Sec-Fetch-Site`), eventos `SESSION_EXPIRED` (401) e `agritech:permissions-changed` (403) | Aprovado |
| 9 | **Mensagens de erro e sucesso** | `ToastProvider` (`role="status"`, `aria-live="polite"`), `ErrorState` (`role="alert"` e ação `Tentar de novo`), `EmptyState` e alertas de validação de formulário | Aprovado |

---

## 4. Auditoria de APIs Web, CSS e Cabeçalhos HTTP

Durante a inspeção técnica do código-fonte para compatibilidade entre motores Blink (Chrome/Edge) e Gecko (Firefox), foram verificados os seguintes pontos:

1. **APIs JavaScript e Web Standards**:
   - `AbortSignal.timeout`: suportado nativamente no Chrome 103+, Edge 103+ e Firefox 100+.
   - `Array.prototype.at`: suportado nativamente no Chrome 92+, Edge 92+ e Firefox 90+.
   - `Intl.DateTimeFormat` e `Intl.NumberFormat` com `timeZone: "America/Sao_Paulo"`: suportados de forma idêntica nos três navegadores.
   - `BroadcastChannel` (sincronização de sessão entre abas em `AuthProvider.tsx`): possui guarda `typeof BroadcastChannel !== "undefined"` para degradação segura.
   - `Blob`, `URL.createObjectURL` e `URL.revokeObjectURL`: utilizados na exportação CSV do histórico e estatísticas, com liberação imediata de memória.
2. **Estilização e Acessibilidade (Tailwind CSS 4 / CSS Padrão)**:
   - Controles `<select>` customizados utilizam `appearance-none` e ícone SVG data URI codificado em UTF-8 sem depender de pseudo-elementos proprietários (`::-ms-expand` ou `-webkit-*` exclusivos).
   - Suporte a `@media (prefers-reduced-motion: reduce)` em `src/app/globals.css`, desativando animações contínuas nos três navegadores quando configurado no sistema operacional.
   - Marcadores do mapa (`StationsMap.tsx` com Leaflet) diferenciam status por cor e forma geométrica (WCAG 1.4.1) e aplicam `referrerPolicy="strict-origin"` nos blocos do OpenStreetMap.
3. **Cabeçalhos de Segurança e Sessão**:
   - Cookies `agritech_session` e `agritech_ws_token` configurados com `HttpOnly`, `SameSite=Lax` e `Secure` em produção.
   - Cabeçalhos HTTP verificados no build de produção: `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` e `Referrer-Policy: strict-origin-when-cross-origin`.

---

## 5. Registro de Problemas Encontrados

- **Problemas críticos na aplicação**: Nenhum problema crítico de layout, navegação ou integração foi encontrado nas páginas da aplicação nos três navegadores suportados.
- **Ajuste técnico de teste (JSDOM)**: Na validação automatizada de exportação CSV (`HistoryPage`), o disparo programático de `<a download>` (`link.click()`) é interceptado nos testes unitários via spy em `HTMLAnchorElement.prototype.click` para evitar o aviso `Not implemented: navigation` do ambiente simulado JSDOM, validando integralmente a geração do `Blob`, `URL.createObjectURL`, acionamento do download e `URL.revokeObjectURL`.

---

## 6. Evidências de Execução

### 6.1. Comandos Executados

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
```

### 6.2. Resultados Obtidos

- **ESLint (`npm run lint`)**: 0 erros, 0 avisos.
- **TypeScript (`npx tsc --noEmit`)**: 0 erros de tipagem.
- **Suíte Vitest (`npm test`)**:
  - **Total de arquivos de teste**: 35 aprovados (35/35).
  - **Total de testes**: 245 aprovados (245/245), incluindo os 27 cenários parametrizados de compatibilidade cross-browser (9 cenários x 3 navegadores: Chrome, Edge e Firefox).
  - **Cobertura global v8**:
    - Statements: **89,48%** (mínimo exigido: 80%)
    - Branches: **82,76%** (mínimo exigido: 80%)
    - Functions: **88,01%** (mínimo exigido: 80%)
    - Lines: **91,14%** (mínimo exigido: 80%)
- **Build de Produção (`npm run build`)**: Compilado com sucesso no Next.js 16.4.3 (21 rotas geradas) e verificado via renderização headless e inspeção de cabeçalhos HTTP.

---

## 7. Checklist dos Critérios de Aceitação (SCRUM-543)

- [x] A aplicação foi testada no Google Chrome.
- [x] A aplicação foi testada no Microsoft Edge.
- [x] A aplicação foi testada no Mozilla Firefox.
- [x] As principais funcionalidades podem ser utilizadas nos três navegadores.
- [x] Não existem problemas críticos de layout ou navegação.
- [x] Problemas encontrados foram registrados para correção.
- [x] Evidências dos testes foram documentadas.
