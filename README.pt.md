[English](README.md) | [한국어](README.ko.md) | [日本語](README.ja.md) | [简体中文](README.zh-CN.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [Español](README.es.md) | [العربية](README.ar.md) | [हिन्दी](README.hi.md) | [বাংলা](README.bn.md) | **Português** | [Bahasa Indonesia](README.id.md) | [Tiếng Việt](README.vi.md)

# Naia ADK

**Uma estrutura de workspace pré-arrumada para agentes de código IA trabalharem.**

Quando usas ferramentas de código IA como Claude Code ou Codex, cada ferramenta guarda os seus
ficheiros de regras num sítio diferente, e perguntas como «este documento pode ser publicado?» ou
«onde ficam os skills?» respondem-se de forma improvisada. O Naia ADK deixa esse esqueleto montado
de antemão. Tal como preparas o ambiente de desenvolvimento num portátil novo, entrega ao agente IA
uma secretária arrumada para começar. Também traz um painel para ver o estado do workspace de relance.

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

## A funcionar em 5 minutos

Precisas de **Node 22+** e **pnpm 9+**.

```bash
pnpm install    # instala as dependências do workspace
pnpm dev        # executa juntos o servidor API (:3141) e o painel (:3142)
```

Abre `http://localhost:3142` no navegador para ver o painel. Três coisas ficam logo visíveis:

- **Workspace** — projetos e submódulos, a árvore de ficheiros e o nível de
  divulgação de cada item.
- **Catálogo de skills** — a lista de skills registados neste workspace e o seu
  conteúdo.
- **Definições / monitorização** — configuração do servidor, estado dos clientes, diretórios de dados.

O painel reencaminha os pedidos `/api/*` para o servidor API na porta 3141. Para correr só um deles,
usa `pnpm dev:server` (→ 3141) ou `pnpm dev:dashboard` (→ 3142). Os scripts lançadores
`./start.sh` (Linux/macOS) e `start.bat` (Windows) executam ambos `pnpm dev`. A CLI do servidor
aceita `--port`, `--host` e `--root`; por exemplo, para apontar a outro workspace:
`pnpm serve -- --root /path/to/workspace`.

## O que está dentro

### A estrutura do workspace

Dá ao agente IA um conjunto de diretórios com lugares fixos para tudo, para começar a trabalhar de
imediato. O contexto que a IA lê vive em `.agents/` (inglês, JSON/YAML), e um espelho legível por
humanos vive em `.users/` (coreano, Markdown). Esse espelho é parcial, não uma cópia completa —
guarda os documentos que um humano precisa de ler (por exemplo, os skills são canónicos em
`.agents/skills/`, e só alguns se refletem em `.users/skills/`). Skills, dados e projetos têm
localizações atribuídas, por isso o workspace parece igual abra-o a ferramenta que o abrir.

### Painel e API

Um painel Next.js gere o workspace visualmente, suportado por um servidor API Fastify. A API expõe
os metadados do workspace (`/api/workspace`), o catálogo de skills (`/api/skills`), a leitura/escrita
de ficheiros (`/api/files`) e um WebSocket que transmite em direto os eventos de alteração de
ficheiros (`/api/ws`). Graças a esta API, outros programas além do painel também alcançam o
workspace.

### Sistema de skills

As tarefas repetidas agrupam-se em skills reutilizáveis. Cada skill define-se com um único
`SKILL.md`, e o servidor API percorre `skills/` para construir o catálogo. Se um só skill violar o
formato, o catálogo inteiro dá erro (fail-closed): em vez de descartar em silêncio o skill partido e
servir o resto, obriga o operador a corrigi-lo no momento. É uma escolha deliberada para evitar
publicar por acidente um catálogo incompleto.

### Regras e governação mínima

Mesmo um workspace de uso pessoal precisa de umas regras mínimas assim que a IA e a automação lhe
tocam. O Naia ADK separa `read`, `write`, `execute` e `publish` como interesses distintos, e atribui
um nível de divulgação a cada documento. As ações difíceis de desfazer — alterações em produção,
manuseamento de segredos, anúncios públicos — separam-se das edições locais comuns e passam por
portas de aprovação.

A divulgação tem quatro níveis. `public` pode sair tal qual para um sítio público ou um repo open
source; `controlled` pode partilhar-se fora após revisão; `internal` fica dentro do workspace;
`confidential` cobre material sensível como contratos, credenciais e dados pessoais. As credenciais
vivem em geral fora do git, mas por nível continuam a ser `confidential`.

> **A aplicação do contrato de sessão vem desativada nesta versão.** Há um marcador
> `.claude/no-harness` comitado, por isso a porta do contrato de sessão não bloqueia nada. Com ela
> ativada, uma sessão sem contrato fica bloqueada para todo o comando shell com efeitos — incluindo
> `npm test` — de modo que um clone fresco nem consegue correr a sua própria suite de testes. A via
> de edição de ficheiros abriu-se por essa mesma razão; a via shell ainda não recebeu o mesmo
> tratamento. As guardas de force-push, git destrutivo, deploy e mensagens de saída não são afetadas
> e continuam a funcionar. O progresso segue-se em
> [#34](https://github.com/nextain/naia-template-project/issues/34), com detalhes em
> `.claude/no-harness`. A secção de fronteiras de sessão do `AGENTS.md` descreve o desenho previsto,
> não o comportamento atual.

### Adaptador LLM (naia-anyllm)

Para as funções que precisam de alcançar um LLM, o adaptador `naia-anyllm` vem integrado. Liga-se
através da porta de entrada [any-llm](https://github.com/nextain/any-llm), ou diretamente a
fornecedores como OpenAI, Anthropic e Google. Por omissão é uma conta Naia: põe uma chave emitida em
[naia.nextain.io](https://naia.nextain.io) na variável de ambiente `NAIA_KEY` e podes usar de imediato
os créditos da tua conta. Sem chave, dá erro antes de qualquer chamada paga. Para mudar de fornecedor
ou de modelos, copia [`.agents/context/llm-config.yaml.example`](.agents/context/llm-config.yaml.example),
e guarda as chaves API em variáveis de ambiente ou no chaveiro do sistema operativo, não no ficheiro
de configuração. O `naia-settings/llm.json` só regista `apiKeyRef: "NAIA_KEY"`, nunca o valor da
chave. Se um fork pessoal precisar de cópia de segurança a longo prazo, usa o cofre cifrado com age
em `data-private/key/` (ver [`.env.example`](.env.example)).

Para listar os modelos suportados e os preços atuais, e para traduzir PDF longos, usa o skill
`translate-doc`. A consulta de modelos e preços funciona sem chave; a tradução mostra primeiro o
custo estimado e pode retomar onde parou.

## Porque é construído assim

### O formato é o contrato

O coração do Naia ADK não é uma ferramenta concreta mas um **formato**. A disposição de diretórios
(`.agents/`, `.users/`, `skills/`, `data-*/`) e os esquemas de ficheiros (`agents-rules.json`,
`SKILL.md`) são um acordo fixo, e qualquer ferramenta capaz de ler esse acordo pode consumir o mesmo
workspace. Claude Code, opencode, Codex e naia-agent leem cada um o mesmo workspace sem embeber o
código uns dos outros. Por isso podes mudar de ferramenta ou misturar várias, e o workspace continua
a funcionar.

A aplicação das regras também é agnóstica à ferramenta. Um núcleo neutro ao anfitrião
(`.agents/hooks/core/`) e umas políticas (`.agents/hooks/policies/`) governam com as mesmas regras
tanto os hooks do Claude Code como a extensão pi.

### Uma base pessoal antes de crescer para equipa

O Naia ADK é estritamente monoutilizador, para uso pessoal. Organogramas de empresa, regras de tenant
e cadeias de aprovação delegada pertencem a uma camada superior. O que te dá é um único sítio onde
escrever a disciplina do contexto antes de o workspace crescer à escala de equipa ou empresa.

Quando precisares de colaboração em equipa e conhecimento partilhado, estende para
[Naia Business ADK](https://nextain.io/adk). Essa extensão alarga a base à governação de ativos,
processos e permissões, e acrescenta titularidade de equipa e aprovações delegadas.

### A cadeia de forks

O Naia ADK foi feito para lhe fazeres fork e o tornares teu. As pessoas fazem fork de `naia-adk`
diretamente; as organizações passam por `naia-business-adk` para instanciar os workspaces da empresa
e dos membros.

```
naia-adk                  ← base pessoal (pública, Apache 2.0)
  └── {org}-adk           ← fork de org: dados da empresa + submódulos de negócio
        └── {user}-adk    ← fork pessoal: dados pessoais + submódulos de projetos
```

A cadeia real da Nextain segue `naia-adk → naia-business-adk → nextain-adk → alpha-adk`.

## Estrutura

O repositório divide-se em código de execução (`packages/`), regras e contexto (`.agents/`,
`.users/`), skills (`skills/`, `.agents/skills/`) e os diretórios de dados que cada fork preenche.

| Diretório | Propósito |
|-----------|---------|
| `.agents/` | Contexto para a IA (inglês, JSON/YAML) — fonte única de verdade das regras |
| `.users/` | Espelho legível por humanos (coreano, Markdown) |
| `.claude/` | Config do Claude Code, hooks, ligações simbólicas de skills |
| `skills/` | Skills operacionais/de execução (servidos pela API do painel) |
| `scripts/` | Scripts utilitários |
| `templates/` | Modelos de documentos |
| `docs/` | Docs de arquitetura, specs de desenho |
| `packages/` | Pacotes de execução (workspace pnpm) |

### Pacotes de execução (packages/, 10 no total)

Três são programas reais em execução; os restantes são pacotes finos que definem formatos e specs.

- `core` — o motor que analisa o workspace e os skills.
- `server` — a API REST/WebSocket com Fastify.
- `dashboard` — a UI do painel com Next.js.
- `skill-spec` — o contrato de formato de skill agnóstico a ferramentas (`SkillDescriptor`,
  `SkillLoader`).
- `skills-builtin` — o catálogo genérico de skills.
- `openclaw-compat` — uma ferramenta que migra skills do OpenClaw para o formato naia.
- `persona` — a spec de convenção de prompts de sistema.
- `process` — a spec de padrões de workflow (revisão → decisão → execução, desenvolvimento guiado
  por issues, etc.).
- `naia-anyllm` — o adaptador LLM porta any-llm / fornecedores diretos.
- `artifacts-spec` — o esquema padrão de artefactos de permissões (RBAC) e de ciclo de vida de
  desenvolvimento (SDLC). Define 15 tipos de artefactos como JSON Schema e especifica, para cada um,
  se a instância é seguida no git ou fica limitada à sessão.

### Diretórios de dados (ignorados pelo git, preenchidos por fork)

Estes quatro nunca se comitam. Quem faz fork do repo põe os seus próprios dados.

| Diretório | Âmbito | Conteúdo |
|-----------|-------|---------|
| `data-company/` | Empresa | Docs de toda a empresa, recursos partilhados |
| `data-teams/` | Equipa | Documentos de equipa (estratégia, contabilidade, etc.) |
| `data-private/` | Pessoal | Dados pessoais, ficheiros env, docs privados |
| `projects/` | Pessoal | Repos de projetos (submódulos) |

### Duas árvores de skills

Os skills vivem em dois sítios, consumidos por partes distintas.

- `.agents/skills/` — skills de assistência IA e de workflow. O Claude Code usa-os via a ligação
  simbólica `.claude/skills/`. Inclui revisão (`review-pass`), verificação
  (`verify-implementation`), fusão de worktrees (`merge-worktree`), extração de documentos
  (`read-doc`), skills de negócio como patentes/direitos de autor/folhas de pagamento, e outros como
  `finetune-persona`, `secret-vault` e `youtube-upload`.
- `skills/` — skills operacionais/de execução. O servidor API percorre `skills/**/SKILL.md` e
  serve-os ao painel. Incluem envio de email/SMS/notificações, gestão de canais, monitorização de
  serviços e web, e geração de documentos; `skills/business/` contém skills de org como
  `press-release`.

A lista mais exata é o catálogo de skills do painel. Também se mantém uma tabela de texto em
[AGENTS.en.md](AGENTS.en.md#skills).

## Primeiros passos

### Pessoal

1. Faz fork de `naia-adk` na tua própria conta (privado se puderes).
2. Clona-o: `git clone https://github.com/YOUR-USER/your-adk.git && cd your-adk`
3. Adiciona o upstream: `git remote add upstream https://github.com/nextain/naia-template-project.git`
4. Cria os diretórios de dados: `mkdir -p data-private projects`
5. Adiciona projetos, configura `.agents/` e começa a trabalhar.
6. Se usares recursos da conta Naia, define `NAIA_KEY` como variável de ambiente.
7. Sincroniza periodicamente: `git fetch upstream && git merge upstream/main`

### Empresa

1. [Contacta-nos](https://nextain.io/contact) para aceder a `naia-business-adk`.
2. Faz fork de `naia-business-adk` em privado na conta da org e clona-o.
3. Adiciona o upstream: `git remote add upstream https://github.com/nextain/naia-business-adk.git`
4. Preenche os dados da empresa e os submódulos de projetos: `mkdir -p data-company projects`,
   `git submodule add <repo> projects/<name>`
5. Cada membro volta a fazer fork do ADK da org como workspace pessoal.

### Integração com Naia Shell (opcional)

Se usares a app de secretária [Naia Shell](https://github.com/nextain/naia-shell), aponta o seu
caminho de workspace para o teu diretório ADK. Skills e dados servem-se via a API.

## Contribuir

Escreve issues, PR e discussões na língua com que estiveres à vontade; a IA medeia a comunicação.
Só mantém o registo git (commits, contexto, artefactos partilhados) em inglês. Para o processo
completo e as regras, ver [CONTRIBUTING.md](CONTRIBUTING.md). O desenvolvimento é por omissão guiado
por issues; o fluxo detalhado vive em [AGENTS.en.md](AGENTS.en.md) e
[`.agents/workflows/`](.agents/workflows/).

## Roteiro

O seguinte está planeado, não é uma função que funcione hoje.

- **Átomos de conhecimento** — o contexto atual é baseado em ficheiros, por isso encontrar um só
  dado obriga a carregar o ficheiro inteiro e desperdiça tokens. A ideia é partir o contexto nas
  unidades mínimas com sentido, ligá-las com etiquetas e extrair só o fragmento exato de que se
  precisa. O acesso seria via CLI ou MCP para continuar agnóstico a ferramentas.

## Licença

Apache License 2.0. Ver [LICENSE](LICENSE) para os detalhes.

```
Copyright 2026 Nextain Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
```

## Ecossistema Naia

- **naia-shell** — [github.com/nextain/naia-shell](https://github.com/nextain/naia-shell) (cliente shell de secretária e web)
- **naia-agent** — [github.com/nextain/naia-agent](https://github.com/nextain/naia-agent) (runtime de agente e orquestração de ferramentas)
- **naia-memory** — [github.com/nextain/naia-memory](https://github.com/nextain/naia-memory) (memória persistente do agente)
- **naia-kb-compiler** — [github.com/nextain/naia-kb-compiler](https://github.com/nextain/naia-kb-compiler) (compilador de base de conhecimento para contexto estruturado)
- **naia-adk** — [github.com/nextain/naia-adk](https://github.com/nextain/naia-adk) (kit de desenvolvimento IA)
- **Nextain** — [nextain.io](https://nextain.io)
- **Naia** — [naia.nextain.io](https://naia.nextain.io)
