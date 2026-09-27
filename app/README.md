# Portal Climático (front-end)

Next.js 16 (App Router), React 19, TanStack Query 5, Tailwind CSS 4, lucide-react, Recharts e Leaflet (mapa).

## Rodar

```bash
cp .env.example .env.local   # endereços dos microsserviços
npm install
npm run dev                  # http://localhost:3010
```

Para subir tudo junto (APIs, banco com dados de demonstração e simulador de estações), use o repositório `API-DSM-4-INFRA`.

| Comando | O que faz |
| --- | --- |
| `npm run lint` | ESLint |
| `npm test` | Vitest + cobertura (mínimo de 80%) |
| `npm run build` | build de produção |

## Como está organizado

```
src/
  app/                  rotas: só montam a página da feature
    (portal)/           grupo com o layout do portal (faixa escura + mega-menu)
  components/
    layout/             AppShell (faixa escura do topo), TopNav (mega-menu), nav.ts
    ui/                 Button, Card, Badge, Avatar, Field, Modal, Table, Segmented, Toast...
    charts/             TrendChart (média + faixa mín–máx)
  features/<domínio>/   api.ts (chamadas), hooks.ts (TanStack Query), *Page.tsx, modais
  lib/api/http.ts       cliente HTTP (erros com a mensagem do serviço)
  test/                 utilitários, fixtures e mock de fetch
```

- **Dados:** toda leitura passa pelo TanStack Query. Ao voltar para uma tela, o cache aparece na hora e a atualização acontece em segundo plano. Status e alertas fazem polling a cada 30 s (ADR-003).
- **Sem mock escondido:** se um serviço falha, a tela mostra o erro com o botão "Tentar de novo". O front não troca dados reais por fictícios sem avisar.
- **Proxy:** o navegador chama só caminhos relativos (`/api/...`). O `next.config.ts` repassa cada caminho para o microsserviço certo.
  - Os destinos (`USERS_API_URL`, `PARAMETERS_API_URL`, `ALERTS_API_URL` e `STATIONS_API_URL`) são gravados no build.
  - Se mudar algum destino, rode o build de novo.
- **Tokens de design:** ficam em `src/app/globals.css` (`@theme`). As cores, raios e sombras vêm dali. Os tons de texto (`muted`, `faint`) e de status passam contraste AA (4,5:1) nos fundos usados.
- **Layout:** cada página começa com o `PageHeader`, desenhado sobre a faixa verde-escura do topo; o primeiro card sobe por cima dela. Na faixa, use os botões `variant="light"` (ação principal) ou `variant="glass"`, e o `Select variant="glass"`.
- **Mapa:** `StationsMap` (Leaflet) carrega só no navegador, via `StationsMapLazy`. Os tiles vêm do OpenStreetMap (sem chave; o Referer vai só com a origem, como pede a política de uso do OSM), dessaturados no CSS. Sem internet, os pinos aparecem sobre um fundo neutro. Nas telas, os testes trocam o mapa por uma região vazia (`src/test/setup.ts`); o mapa tem teste próprio.
