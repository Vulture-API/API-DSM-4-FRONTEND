# Login e controle de acesso do frontend

## Fluxo implementado

1. `/login` usa a identidade visual do portal, com layout responsivo, campos acessíveis, validação, exibição de senha, carregamento e mensagens de erro.
2. O formulário chama `POST /api/auth/login` no Next. O servidor chama o login existente do backend e valida o resultado em `GET /api/auth/me`.
3. O JWT fica nos cookies HttpOnly `agritech_session` (caminho `/`) e `agritech_ws_token` (caminho `/api/stations/current/ws`). Ambos usam SameSite=Lax e Secure em produção. O JSON recebido pelo navegador contém a identidade e as permissões, sem o token. Não há JWT em localStorage/sessionStorage.
4. O layout do portal exige cookie; o `AuthGate` aguarda a identidade e verifica a permissão antes de montar a página. A navegação, formulários e botões também usam as permissões.
5. REST passa por `/api/backend/...`: destinos fixos, verificação de origem em alterações, consulta da identidade no backend em cada chamada e verificação da permissão. Só então o Next encaminha o Bearer. As respostas não são armazenadas em cache HTTP. Uma permissão removida não depende do cache visual para bloquear a operação.
6. O WebSocket mantém o endereço existente e usa o cookie específico. Logout, expiração e perda da permissão de monitoramento fecham a conexão no frontend. O backend também verifica autorização antes de entregar novas medições quando seu controle está habilitado.
7. `/api/auth/me` é reconsultado a cada 60 segundos e ao recuperar foco. Erros 403 solicitam atualização das permissões; 401 encerram a sessão local. Mudanças de identidade/permissões limpam os dados de consultas anteriores. Login/logout avisam outras abas por BroadcastChannel.
8. Logout apaga os dois cookies e limpa o cache. O backend atual não possui revogação de JWT ou refresh token: não há renovação silenciosa; ao expirar o token, é preciso entrar novamente.

## Configuração necessária no backend

Não foram alterados segredos, concessões do banco ou flags locais por esta implementação.

- Aplicar as migrations de autenticação/permissões do repositório de banco conforme a documentação do backend.
- Configurar `JWT_SECRET` com pelo menos 32 caracteres aleatórios **somente no backend**, fora do Git. O frontend não precisa conhecer o segredo.
- Usar uma conta ativa com credencial válida existente. Não foi criada uma conta de demonstração ou senha padrão.
- Conferir as permissões dos três cargos. O nome do cargo não concede direitos sozinho: o frontend usa `permissions` de `/api/auth/me`, vinculadas ao `role_id` pelo backend.
- Habilitar `ACCESS_CONTROL_ENABLED=true` no backend depois de configurar as concessões. Sem isso, as rotas legadas e o WebSocket continuam acessíveis diretamente no backend. A checagem do proxy do frontend não substitui essa proteção.
- Reiniciar o backend após alterar seu ambiente. Em produção, servir o portal por HTTPS devido aos cookies Secure.

A instalação inicial do backend concede permissões ao Administrador; Gerente e Cliente podem começar sem concessões. Nesse caso, o login válido leva a "Acesso não permitido" até o backend configurar o perfil. Não tratar isso como falha de senha.

### Distribuição compatível com os perfis definidos

As concessões abaixo são a configuração a aplicar no backend, não uma suposição automática por nome ou ID no frontend. Não há separação de acesso por propriedade.

| Perfil | Concessões |
| --- | --- |
| ADMIN | Todo o catálogo de permissões existente do backend. |
| GERENTE | `monitoring.read`, `stations.read`, `sensors.read`, `sensor-types.read`, `properties.create`, `properties.read`, `properties.update`, `properties.delete`, `alert-configs.create`, `alert-configs.read`, `alert-configs.update`, `alert-configs.delete`, `triggered-alerts.read`, `triggered-alerts.acknowledge`, `occurrences.read`. |
| CLIENTE | `monitoring.read`, `stations.read`, `sensors.read`, `sensor-types.read`, `properties.read`. |

O backend disponibiliza `GET /api/permissions`, `GET /api/roles/:id/permissions` e `PUT /api/roles/:id/permissions` para conferir/configurar as concessões com uma sessão administrativa. O PUT recebe `{ "permissions": ["código", "outro.código"] }` e substitui a lista completa. Consultar os IDs reais dos cargos antes de usar esses endpoints. Não foram adicionadas telas para criar cargos: os três cargos existentes continuam sendo utilizados.

`properties.read`, `sensors.read` e `sensor-types.read` também são usados para nomes e filtros de consulta. Por isso, ler tipos não abre a administração do catálogo: a página `/administracao/parametros` exige `sensor-types.update`. A tela de usuários exige `users.read`; criação, edição, bloqueio e exclusão respeitam suas permissões específicas. A edição de `role_id` continua usando o formulário existente.

O código `monitoring.read` cobre dados atuais, séries, histórico, estatísticas e previsão no backend atual. Caso seja necessário distinguir essas consultas entre Cliente e Gerente, o catálogo do backend precisará separar essas permissões.

## Ambiente do frontend

No monólito local, normalmente todos os destinos apontam para a mesma API:

```dotenv
USERS_API_URL=http://localhost:3000
PARAMETERS_API_URL=http://localhost:3000
ALERTS_API_URL=http://localhost:3000
STATIONS_API_URL=http://localhost:3000
```

Usar a porta real do backend. As variáveis são de servidor, sem `NEXT_PUBLIC_`. REST lê os destinos no servidor do Next; o rewrite WebSocket é definido no build. Reiniciar o Next após mudanças de `.env` e refazer o build ao mudar o destino WebSocket. Os dois Dockerfiles agora preservam esses destinos também no estágio de produção; as variáveis podem ser substituídas no runtime do container.

```powershell
# Dentro de API-DSM-4-FRONTEND/app
npm install
npm run dev
# Abrir http://localhost:3010/login
```

## Validação automatizada

```powershell
npx vitest run
npx tsc --noEmit
npm run lint
npm run build
```

Os testes de autenticação validam o formulário e seu fluxo real até o endpoint do Next, bloqueio de páginas, menus e ações, carregamento, erro, encerramento de sessão, limpeza de cache e fechamento do WebSocket. Os testes dos Route Handlers validam cookies, propagação do Bearer, identidade, permissões, origem da requisição, indisponibilidade, limite de tentativas e rejeição de destinos arbitrários. As respostas do backend são controladas nesses testes: não são evidência de login com uma conta real no banco local.

Não foram feitos commit, push ou alterações no banco.

### Evidências desta implementação

- Suíte completa: 177/178 testes passaram na execução com limite padrão; o cenário 3 do histórico atingiu 5 segundos.
- Reexecução de histórico e autenticação com `--testTimeout=15000 --maxWorkers=1`: 26/26 passaram, incluindo o cenário que havia atingido o limite e o teste do menu com permissões de consulta dos sensores. Os 178 cenários distintos ficaram validados entre as execuções.
- `npx tsc --noEmit`: aprovado.
- ESLint dos arquivos alterados: aprovado, sem erros nem avisos.
- Build de produção em cópia isolada, `next build --webpack`: aprovado, com `/login`, os três endpoints de autenticação e `/api/backend/[...path]` gerados.
- Checagem HTTP do build: `/login` retorna 200 e o formulário; `/dashboard` sem sessão redireciona para `/login`; `/api/auth/me` e `/api/backend/stations/current` sem sessão retornam 401; logout com outra origem retorna 403.

O servidor de desenvolvimento e o banco não foram modificados por essas verificações. O teste de login com uma conta real depende da configuração do backend descrita acima.
