[English](README.md) | [한국어](README.ko.md) | [日本語](README.ja.md) | [简体中文](README.zh-CN.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | **Español** | [العربية](README.ar.md) | [हिन्दी](README.hi.md) | [বাংলা](README.bn.md) | [Português](README.pt.md) | [Bahasa Indonesia](README.id.md) | [Tiếng Việt](README.vi.md)

# Naia ADK

**Un andamio de espacio de trabajo preordenado para que trabajen los agentes de código IA.**

Cuando usas herramientas de código IA como Claude Code o Codex, cada herramienta guarda sus archivos
de reglas en un lugar distinto, y preguntas como «¿este documento puede publicarse?» o «¿dónde van
los skills?» se responden de forma improvisada. Naia ADK deja tendida esa estructura por adelantado.
Igual que preparas el entorno de desarrollo en un portátil nuevo, le entrega al agente IA un
escritorio ordenado desde el que empezar. También incluye un panel para ver el estado del workspace
de un vistazo.

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

## En marcha en 5 minutos

Necesitas **Node 22+** y **pnpm 9+**.

```bash
pnpm install    # instala las dependencias del workspace
pnpm dev        # ejecuta juntos el servidor API (:3141) y el panel (:3142)
```

Abre `http://localhost:3142` en tu navegador para ver el panel. Tres cosas se ven de inmediato:

- **Workspace** — proyectos y submódulos, el árbol de archivos y el nivel de
  divulgación de cada elemento.
- **Catálogo de skills** — la lista de skills registrados en este workspace y su
  contenido.
- **Ajustes / supervisión** — configuración del servidor, estado de los clientes, directorios de datos.

El panel reenvía las peticiones `/api/*` al servidor API en el puerto 3141. Para ejecutar solo uno
de ellos, usa `pnpm dev:server` (→ 3141) o `pnpm dev:dashboard` (→ 3142). Los scripts lanzadores
`./start.sh` (Linux/macOS) y `start.bat` (Windows) ejecutan ambos `pnpm dev`. La CLI del servidor
acepta `--port`, `--host` y `--root`; por ejemplo, para apuntar a otro workspace:
`pnpm serve -- --root /path/to/workspace`.

## Qué hay dentro

### El andamio del workspace

Le da al agente IA un conjunto de directorios con lugares fijos para todo, para que empiece a
trabajar de inmediato. El contexto que lee la IA vive en `.agents/` (inglés, JSON/YAML), y un espejo
legible por humanos vive en `.users/` (coreano, Markdown). Ese espejo es parcial, no una copia
completa: guarda los documentos que un humano necesita leer (por ejemplo, los skills son canónicos en
`.agents/skills/`, y solo algunos se reflejan en `.users/skills/`). Skills, datos y proyectos tienen
ubicaciones asignadas, así que el workspace se ve igual lo abra la herramienta que lo abra.

### Panel y API

Un panel Next.js administra el workspace de forma visual, respaldado por un servidor API Fastify. La
API expone los metadatos del workspace (`/api/workspace`), el catálogo de skills (`/api/skills`), la
lectura/escritura de archivos (`/api/files`) y un WebSocket que transmite los cambios de archivos en
tiempo real (`/api/ws`). Gracias a esta API, otros programas además del panel también alcanzan el
workspace.

### Sistema de skills

Las tareas repetidas se empaquetan como skills reutilizables. Cada skill se define con un único
`SKILL.md`, y el servidor API recorre `skills/` para construir el catálogo. Si un solo skill viola el
formato, todo el catálogo lanza un error (fail-closed): en lugar de descartar en silencio el skill
roto y servir el resto, obliga al operador a corregirlo en el acto. Es una decisión deliberada para
evitar publicar por accidente un catálogo incompleto.

### Reglas y gobernanza mínima

Incluso un workspace de uso personal necesita unas reglas mínimas en cuanto lo tocan la IA y la
automatización. Naia ADK separa `read`, `write`, `execute` y `publish` como intereses distintos, y
asigna un nivel de divulgación a cada documento. Las acciones difíciles de deshacer — cambios en
producción, manejo de secretos, anuncios públicos — se separan de las ediciones locales ordinarias y
pasan por puertas de aprobación.

La divulgación tiene cuatro niveles. `public` puede salir tal cual a un sitio público o a un repo
open source; `controlled` puede compartirse fuera tras una revisión; `internal` se queda dentro del
workspace; `confidential` cubre material sensible como contratos, credenciales y datos personales.
Las credenciales suelen vivir fuera de git, pero por nivel siguen siendo `confidential`.

> **La aplicación del contrato de sesión viene desactivada en esta versión.** Hay un marcador
> `.claude/no-harness` commiteado, así que la puerta del contrato de sesión no bloquea nada. Con ella
> activada, una sesión sin contrato queda bloqueada para todo comando shell con efectos — incluido
> `npm test` — de modo que un clon fresco ni siquiera puede correr su propia suite de pruebas. La vía
> de edición de archivos se abrió por esa misma razón; la vía shell aún no ha recibido el mismo
> trato. Las guardias de force-push, git destructivo, despliegue y mensajería saliente no se ven
> afectadas y siguen funcionando. El progreso se sigue en
> [#34](https://github.com/nextain/naia-template-project/issues/34), con detalles en
> `.claude/no-harness`. La sección de límites de sesión de `AGENTS.md` describe el diseño previsto, no
> el comportamiento actual.

### Adaptador LLM (naia-anyllm)

Para las funciones que necesitan alcanzar un LLM, el adaptador `naia-anyllm` viene integrado. Se
conecta a través de la pasarela [any-llm](https://github.com/nextain/any-llm), o directamente a
proveedores como OpenAI, Anthropic y Google. Por defecto es una cuenta Naia: pon una clave emitida en
[naia.nextain.io](https://naia.nextain.io) en la variable de entorno `NAIA_KEY` y podrás usar de
inmediato los créditos de tu cuenta. Sin clave, lanza un error antes de cualquier llamada de pago.
Para cambiar de proveedor o de modelos, copia
[`.agents/context/llm-config.yaml.example`](.agents/context/llm-config.yaml.example), y guarda las
claves API en variables de entorno o en el llavero del sistema operativo, no en el archivo de
configuración. `naia-settings/llm.json` solo registra `apiKeyRef: "NAIA_KEY"`, nunca el valor de la
clave. Si un fork personal necesita respaldo a largo plazo, usa la bóveda cifrada con age en
`data-private/key/` (ver [`.env.example`](.env.example)).

Para listar los modelos soportados y sus precios actuales, y para traducir PDF largos, usa el skill
`translate-doc`. La consulta de modelos y precios funciona sin clave; la traducción muestra primero
el coste estimado y puede reanudarse donde se detuvo.

## Por qué está construido así

### El formato es el contrato

El corazón de Naia ADK no es una herramienta concreta sino un **formato**. La disposición de
directorios (`.agents/`, `.users/`, `skills/`, `data-*/`) y los esquemas de archivos
(`agents-rules.json`, `SKILL.md`) son un acuerdo fijo, y cualquier herramienta capaz de leer ese
acuerdo puede consumir el mismo workspace. Claude Code, opencode, Codex y naia-agent leen cada uno el
mismo workspace sin embeber el código de los demás. Así que puedes cambiar de herramienta o mezclar
varias, y el workspace sigue funcionando.

La aplicación de las reglas también es agnóstica a la herramienta. Un núcleo neutral al host
(`.agents/hooks/core/`) y unas políticas (`.agents/hooks/policies/`) gobiernan con las mismas reglas
tanto los hooks de Claude Code como la extensión pi.

### Una base personal antes de crecer a equipo

Naia ADK es estrictamente monousuario, para uso personal. Organigramas de empresa, reglas de tenant
y cadenas de aprobación delegada pertenecen a una capa superior. Lo que te da es un único lugar donde
escribir la disciplina del contexto antes de que el workspace crezca a escala de equipo o empresa.

Cuando necesites colaboración en equipo y conocimiento compartido, extiende a
[Naia Business ADK](https://nextain.io/adk). Esa extensión amplía la base hacia la gobernanza de
activos, procesos y permisos, y añade titularidad de equipo y aprobaciones delegadas.

### La cadena de forks

Naia ADK está pensado para forkearlo y hacerlo tuyo. Las personas forkean `naia-adk` directamente;
las organizaciones pasan por `naia-business-adk` para instanciar los workspaces de la empresa y de
los miembros.

```
naia-adk                  ← base personal (pública, Apache 2.0)
  └── {org}-adk           ← fork de org: datos de empresa + submódulos de negocio
        └── {user}-adk    ← fork personal: datos personales + submódulos de proyectos
```

La cadena real de Nextain sigue `naia-adk → naia-business-adk → nextain-adk → alpha-adk`.

## Estructura

El repositorio se divide en código de ejecución (`packages/`), reglas y contexto (`.agents/`,
`.users/`), skills (`skills/`, `.agents/skills/`) y los directorios de datos que cada fork rellena.

| Directorio | Propósito |
|-----------|---------|
| `.agents/` | Contexto para la IA (inglés, JSON/YAML) — fuente única de verdad de las reglas |
| `.users/` | Espejo legible por humanos (coreano, Markdown) |
| `.claude/` | Config de Claude Code, hooks, enlaces simbólicos de skills |
| `skills/` | Skills operativos/de ejecución (servidos por la API del panel) |
| `scripts/` | Scripts de utilidades |
| `templates/` | Plantillas de documentos |
| `docs/` | Docs de arquitectura, specs de diseño |
| `packages/` | Paquetes de ejecución (workspace pnpm) |

### Paquetes de ejecución (packages/, 10 en total)

Tres son programas reales en ejecución; el resto son paquetes delgados que definen formatos y specs.

- `core` — el motor que analiza el workspace y los skills.
- `server` — la API REST/WebSocket con Fastify.
- `dashboard` — la UI del panel con Next.js.
- `skill-spec` — el contrato de formato de skill agnóstico a herramientas (`SkillDescriptor`,
  `SkillLoader`).
- `skills-builtin` — el catálogo genérico de skills.
- `openclaw-compat` — una herramienta que migra skills de OpenClaw al formato naia.
- `persona` — la spec de convención de prompts de sistema.
- `process` — la spec de patrones de workflow (revisión → decisión → ejecución, desarrollo guiado
  por issues, etc.).
- `naia-anyllm` — el adaptador LLM pasarela any-llm / proveedores directos.
- `artifacts-spec` — el esquema estándar de artefactos de permisos (RBAC) y de ciclo de vida de
  desarrollo (SDLC). Define 15 tipos de artefactos como JSON Schema y especifica, para cada uno, si
  la instancia se rastrea en git o queda limitada a la sesión.

### Directorios de datos (ignorados por git, rellenados por fork)

Estos cuatro nunca se commitean. Quien forkea el repo pone sus propios datos.

| Directorio | Alcance | Contenido |
|-----------|-------|---------|
| `data-company/` | Empresa | Docs de toda la empresa, recursos compartidos |
| `data-teams/` | Equipo | Documentos de equipo (estrategia, contabilidad, etc.) |
| `data-private/` | Personal | Datos personales, archivos env, docs privados |
| `projects/` | Personal | Repos de proyectos (submódulos) |

### Dos árboles de skills

Los skills viven en dos lugares, consumidos por distintas partes.

- `.agents/skills/` — skills de asistencia IA y de workflow. Claude Code los usa vía el enlace
  simbólico `.claude/skills/`. Incluye revisión (`review-pass`), verificación
  (`verify-implementation`), fusión de worktrees (`merge-worktree`), extracción de documentos
  (`read-doc`), skills de negocio como patentes/copyright/nómina, y otros como `finetune-persona`,
  `secret-vault` y `youtube-upload`.
- `skills/` — skills operativos/de ejecución. El servidor API recorre `skills/**/SKILL.md` y los
  sirve al panel. Incluyen envío de email/SMS/notificaciones, gestión de canales, monitoreo de
  servicios y web, y generación de documentos; `skills/business/` contiene skills de org como
  `press-release`.

La lista más exacta es el catálogo de skills del panel. También se mantiene una tabla de texto en
[AGENTS.en.md](AGENTS.en.md#skills).

## Primeros pasos

### Personal

1. Forkea `naia-adk` en tu propia cuenta (privado si puedes).
2. Clónalo: `git clone https://github.com/YOUR-USER/your-adk.git && cd your-adk`
3. Añade el upstream: `git remote add upstream https://github.com/nextain/naia-template-project.git`
4. Crea los directorios de datos: `mkdir -p data-private projects`
5. Añade proyectos, configura `.agents/` y empieza a trabajar.
6. Si usas recursos de la cuenta Naia, define `NAIA_KEY` como variable de entorno.
7. Sincroniza periódicamente: `git fetch upstream && git merge upstream/main`

### Empresa

1. [Contáctanos](https://nextain.io/contact) para acceder a `naia-business-adk`.
2. Forkea `naia-business-adk` en privado en la cuenta de la org y clónalo.
3. Añade el upstream: `git remote add upstream https://github.com/nextain/naia-business-adk.git`
4. Rellena los datos de empresa y los submódulos de proyectos: `mkdir -p data-company projects`,
   `git submodule add <repo> projects/<name>`
5. Cada miembro vuelve a forkear el ADK de la org como workspace personal.

### Integración con Naia Shell (opcional)

Si usas la app de escritorio [Naia Shell](https://github.com/nextain/naia-shell), apunta su ruta de
workspace a tu directorio ADK. Skills y datos se sirven vía la API.

## Contribuir

Escribe issues, PR y discusiones en el idioma con el que estés cómodo; la IA media la comunicación.
Solo mantén el registro git (commits, contexto, artefactos compartidos) en inglés. Para el proceso
completo y las reglas, ver [CONTRIBUTING.md](CONTRIBUTING.md). El desarrollo es por defecto guiado
por issues; el flujo detallado vive en [AGENTS.en.md](AGENTS.en.md) y
[`.agents/workflows/`](.agents/workflows/).

## Hoja de ruta

Lo siguiente está planeado, no es una función que funcione hoy.

- **Átomos de conocimiento** — el contexto actual está basado en archivos, así que encontrar un solo
  dato obliga a cargar todo el archivo y desperdicia tokens. La idea es romper el contexto en las
  unidades mínimas con sentido, enlazarlas con etiquetas y extraer solo el fragmento exacto que se
  necesita. El acceso sería vía CLI o MCP para seguir siendo agnóstico a herramientas.

## Licencia

Apache License 2.0. Ver [LICENSE](LICENSE) para los detalles.

```
Copyright 2026 Nextain Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
```

## Ecosistema Naia

- **naia-shell** — [github.com/nextain/naia-shell](https://github.com/nextain/naia-shell) (cliente shell de escritorio y web)
- **naia-agent** — [github.com/nextain/naia-agent](https://github.com/nextain/naia-agent) (runtime de agente y orquestación de herramientas)
- **naia-memory** — [github.com/nextain/naia-memory](https://github.com/nextain/naia-memory) (memoria persistente del agente)
- **naia-kb-compiler** — [github.com/nextain/naia-kb-compiler](https://github.com/nextain/naia-kb-compiler) (compilador de base de conocimiento para contexto estructurado)
- **naia-adk** — [github.com/nextain/naia-adk](https://github.com/nextain/naia-adk) (kit de desarrollo IA)
- **Nextain** — [nextain.io](https://nextain.io)
- **Naia** — [naia.nextain.io](https://naia.nextain.io)
