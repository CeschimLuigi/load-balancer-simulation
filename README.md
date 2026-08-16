# Cluster Resiliente

Ambiente local de cluster com balanceamento de carga e resiliência, construído apenas com ferramentas open source. A aplicação base é uma API HTTP em Node.js/TypeScript que devolve o hostname do container que processou a requisição, permitindo comprovar visualmente a distribuição de tráfego e o auto-healing.

Referência de planejamento: `docs/Mini Projeto Cluster Resiliente V2.docx`

## Stack

| Camada | Tecnologia |
|---|---|
| Aplicação HTTP | Node.js 18 + TypeScript + Express 5 |
| Containerização | Docker |
| Orquestração | Docker Swarm |
| Balanceador de carga | Nginx (proxy reverso, Round Robin) |

## Arquitetura

```
                    :80
Cliente  ──────►  Nginx (1 réplica)
                    │  proxy_pass http://api:3333
                    ▼
              Swarm DNS/VIP "api"
             ┌──────┼──────┐
             ▼      ▼      ▼
           api.1  api.2  api.3     (réplicas escaláveis)
             :3333  :3333  :3333
```

O Nginx faz `proxy_pass` para o nome de serviço `api`. A resolução desse nome é feita pelo DNS interno do Swarm, que aplica Round Robin entre as tasks saudáveis do serviço. Nenhuma réplica é exposta diretamente ao host — a única porta publicada é a `80` do Nginx.

## Requisitos atendidos

Funcionais
- **RF01** — endpoint `GET /cluster` retorna o hostname do container (`os.hostname()`, que no Docker equivale ao ID curto do container). Ver [src/app.ts](src/app.ts).
- **RF02** — distribuição alternada das requisições entre as instâncias, via Nginx + DNS round robin do Swarm. Ver [nginx.conf](nginx.conf).
- **RF03** — escalonamento horizontal por parâmetro declarativo (`deploy.replicas`) ou por comando (`docker service scale`). Ver [docker-compose.yml](docker-compose.yml).

Não funcionais
- **RNF01 (Resiliência / auto-healing)** — o Swarm reconcilia o estado desejado: ao perder um container, uma nova task é criada automaticamente para restabelecer o número de réplicas.
- **RNF02 (Tecnologia aberta)** — Docker, Docker Swarm, Nginx, Node.js e Express; sem vendor lock-in.
- **RNF03 (Portabilidade e automação)** — toda a stack sobe com um único comando declarativo (`docker stack deploy`).

## Estrutura do projeto

```
.
├── src/
│   ├── app.ts             # aplicação Express e rota /cluster
│   └── server.ts          # bootstrap do servidor na porta 3333
├── Dockerfile             # imagem da API (build TS -> build/)
├── docker-compose.yml     # stack Swarm: api (3 réplicas) + nginx
├── nginx.conf             # proxy reverso para http://api:3333
├── tsconfig.json
└── docs/                  # documento de planejamento
```

## Pré-requisitos

- Docker Engine com suporte a Swarm
- Node.js 18+ (apenas para rodar a API fora de container)

## Execução local (sem Docker)

```bash
npm install
npm run dev            # tsx --watch, hot reload
```

Build e execução do artefato compilado:

```bash
npm run build          # limpa build/ e compila com tsc
npm start              # node build/server.js
```

Teste:

```bash
curl http://localhost:3333/cluster
```

Scripts disponíveis:

| Script | Ação |
|---|---|
| `npm run dev` | executa `src/server.ts` em watch mode |
| `npm run build` | remove `build/` e compila o TypeScript |
| `npm run clean` | remove o diretório `build/` |
| `npm start` | roda `build/server.js` (dispara `build` antes, via `prestart`) |

## Execução do cluster (Docker Swarm)

1. Build da imagem — a stack consome a imagem local `mini-cluster-api`, portanto ela precisa existir antes do deploy:

```bash
docker build -t mini-cluster-api .
```

2. Inicialize o Swarm (apenas na primeira vez):

```bash
docker swarm init
```

3. Suba a stack inteira com um único comando:

```bash
docker stack deploy -c docker-compose.yml cluster
```

4. Verifique os serviços:

```bash
docker stack services cluster
docker service ps cluster_api
```

A aplicação fica acessível em `http://localhost/cluster`.

Para remover tudo:

```bash
docker stack rm cluster
```

## Validação dos critérios de aceite

**1. Subir a infraestrutura com um único comando**

```bash
docker stack deploy -c docker-compose.yml cluster
```

**2. Balanceamento de carga — o ID do servidor muda a cada requisição**

```bash
for i in $(seq 1 6); do curl -s http://localhost/cluster; echo; done
```

Saída esperada — o ID alterna entre as réplicas:

```
{"message":"REQUISIÇÃO PROCESSADA COM SUCESSO COM CLUSTER ID: 3f2a1b9c4d5e"}
{"message":"REQUISIÇÃO PROCESSADA COM SUCESSO COM CLUSTER ID: a71c8e02b6f4"}
{"message":"REQUISIÇÃO PROCESSADA COM SUCESSO COM CLUSTER ID: c904de3781aa"}
```

**3. Resiliência — matar um container e observar a recriação automática**

```bash
docker ps --filter name=cluster_api           # escolha um container
docker kill <container_id>
docker service ps cluster_api                 # a task morta aparece como Failed/Shutdown
                                              # e uma nova task sobe como Running
```

Durante o processo, `curl http://localhost/cluster` deve continuar respondendo pelas réplicas restantes.

**4. Escalabilidade horizontal**

Via comando:

```bash
docker service scale cluster_api=5
```

Ou de forma declarativa, ajustando `deploy.replicas` em [docker-compose.yml](docker-compose.yml) e reaplicando o deploy:

```bash
docker stack deploy -c docker-compose.yml cluster
```

## API

### `GET /cluster`

Retorna o identificador do container que processou a requisição.

Resposta `200 OK`:

```json
{
  "message": "REQUISIÇÃO PROCESSADA COM SUCESSO COM CLUSTER ID: 3f2a1b9c4d5e"
}
```

Porta interna da aplicação: `3333`. Porta pública do cluster: `80` (Nginx).

## Roadmap — Sprint 2 (Elasticidade e Auto-scaling)

- **RNF04 (Disponibilidade / auto-scaling)** — criar novas réplicas automaticamente quando as existentes estiverem sobrecarregadas, sem intervenção manual.
- Remover réplicas automaticamente conforme a queda do volume de requisições, evitando redundância e desperdício de recursos.

## Autor

Luigi Ceschim — licença ISC.
