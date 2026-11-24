[English](README.md) | [한국어](README.ko.md) | [日本語](README.ja.md) | [简体中文](README.zh-CN.md) | **Français** | [Deutsch](README.de.md) | [Русский](README.ru.md) | [Español](README.es.md) | [العربية](README.ar.md) | [हिन्दी](README.hi.md) | [বাংলা](README.bn.md) | [Português](README.pt.md) | [Bahasa Indonesia](README.id.md) | [Tiếng Việt](README.vi.md)

# Naia ADK

**Un échafaudage d'espace de travail pré-aménagé pour que les agents de code IA travaillent.**

Quand on utilise des outils de code IA comme Claude Code ou Codex, chaque outil range ses fichiers
de règles à un endroit différent, et des questions comme « ce document peut-il être publié ? » ou
« où vont les skills ? » se règlent au cas par cas. Naia ADK pose cette ossature à l'avance. Comme on
prépare un environnement de développement sur un nouveau portable, il remet à l'agent IA un bureau
rangé pour démarrer. Il fournit aussi un tableau de bord pour voir l'état du workspace d'un coup d'œil.

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

## Opérationnel en 5 minutes

Il faut **Node 22+** et **pnpm 9+**.

```bash
pnpm install    # installe les dépendances du workspace
pnpm dev        # lance ensemble le serveur API (:3141) et le tableau de bord (:3142)
```

Ouvrez `http://localhost:3142` dans votre navigateur pour voir le tableau de bord. Trois choses
sont visibles tout de suite :

- **Workspace** — projets et sous-modules, arborescence des fichiers, et niveau de
  divulgation de chaque élément.
- **Catalogue de skills** — la liste des skills enregistrés dans ce workspace, et leur
  contenu.
- **Réglages / supervision** — configuration du serveur, état des clients, répertoires de données.

Le tableau de bord transfère les requêtes `/api/*` vers le serveur API sur le port 3141. Pour n'en
lancer qu'un seul, utilisez `pnpm dev:server` (→ 3141) ou `pnpm dev:dashboard` (→ 3142).
Les scripts de lancement `./start.sh` (Linux/macOS) et `start.bat` (Windows) exécutent tous deux
`pnpm dev`. La CLI du serveur accepte `--port`, `--host` et `--root` ; par exemple, pour viser
un autre workspace : `pnpm serve -- --root /path/to/workspace`.

## Contenu

### L'échafaudage du workspace

Il offre à l'agent IA un ensemble de répertoires aux emplacements fixés, pour qu'il commence à
travailler aussitôt. Le contexte destiné à l'IA vit dans `.agents/` (anglais, JSON/YAML), et un miroir
lisible par l'humain vit dans `.users/` (coréen, Markdown). Ce miroir est partiel, pas une copie
complète — il rassemble les documents qu'un humain doit lire (par exemple, les skills font autorité
sous `.agents/skills/`, et seuls certains sont reflétés dans `.users/skills/`). Skills, données et
projets ont tous des emplacements attitrés, si bien que le workspace se présente de la même façon
quel que soit l'outil qui l'ouvre.

### Tableau de bord et API

Un tableau de bord Next.js administre visuellement le workspace, adossé à un serveur API Fastify.
L'API expose les métadonnées du workspace (`/api/workspace`), le catalogue de skills
(`/api/skills`), la lecture/écriture de fichiers (`/api/files`), et un WebSocket qui diffuse les
changements de fichiers en continu (`/api/ws`). Grâce à cette API, d'autres programmes que le
tableau de bord peuvent aussi atteindre le workspace.

### Système de skills

Les tâches répétées sont regroupées en skills réutilisables. Chaque skill est défini par un seul
`SKILL.md`, et le serveur API parcourt `skills/` pour construire le catalogue. Si un seul skill
viole le format, tout le catalogue lève une erreur (fermeture par défaut) : plutôt que d'écarter
silencieusement le skill cassé et de servir le reste, l'opérateur est contraint de le corriger sur
place. C'est un choix délibéré pour éviter de livrer par accident un catalogue incomplet.

### Règles et gouvernance minimale

Même un workspace utilisé seul a besoin de quelques règles minimales dès que l'IA et
l'automatisation y touchent. Naia ADK sépare `read`, `write`, `execute` et `publish` en
préoccupations distinctes, et attache un niveau de divulgation à chaque document. Les actions
difficiles à défaire — changements en production, manipulation de secrets, annonces publiques —
sont isolées des modifications locales ordinaires et passent par des portes d'approbation.

La divulgation a quatre niveaux. `public` peut partir tel quel vers un site public ou un dépôt
open source ; `controlled` peut être partagé à l'extérieur après revue ; `internal` reste à
l'intérieur du workspace ; `confidential` couvre les matières sensibles comme les contrats, les
identifiants et les données personnelles. Les identifiants vivent en général hors de git, mais par
niveau ils restent `confidential`.

> **L'application du contrat de session est désactivée dans cette version.** Un marqueur
> `.claude/no-harness` est commité, donc la porte du contrat de session ne bloque rien. Une fois
> activée, une session sans contrat est bloquée pour toute commande shell à effet de bord — y compris
> `npm test` — si bien qu'un clone frais ne peut même pas lancer sa propre suite de tests. Le chemin
> d'édition de fichiers a été ouvert pour cette même raison ; le chemin shell n'a pas encore reçu le
> même traitement. Les gardes de force-push, de git destructeur, de déploiement et de messagerie
> sortante ne sont pas affectés et fonctionnent toujours. Le suivi se fait dans
> [#34](https://github.com/nextain/naia-template-project/issues/34), avec les détails dans
> `.claude/no-harness`. La section « Session Boundaries » de `AGENTS.md` décrit la conception
> visée, pas le comportement actuel.

### Adaptateur LLM (naia-anyllm)

Pour les fonctions qui doivent joindre un LLM, l'adaptateur `naia-anyllm` est intégré. Il se
connecte via la passerelle [any-llm](https://github.com/nextain/any-llm), ou directement à des
fournisseurs comme OpenAI, Anthropic et Google. Par défaut, c'est un compte Naia : mettez une clé
délivrée sur [naia.nextain.io](https://naia.nextain.io) dans la variable d'environnement `NAIA_KEY`
et vous pouvez utiliser aussitôt les crédits de votre compte. Sans clé, il lève une erreur avant tout
appel payant. Pour changer de fournisseur ou de modèle, copiez
[`.agents/context/llm-config.yaml.example`](.agents/context/llm-config.yaml.example), et gardez les
clés API dans des variables d'environnement ou le trousseau du système d'exploitation, pas dans le
fichier de configuration. `naia-settings/llm.json` n'enregistre que `apiKeyRef: "NAIA_KEY"`, jamais la
valeur de la clé. Si un fork personnel a besoin d'une sauvegarde à long terme, utilisez le coffre
chiffré age dans `data-private/key/` (voir [`.env.example`](.env.example)).

Pour lister les modèles pris en charge et leurs prix actuels, et pour traduire de longs PDF,
utilisez le skill `translate-doc`. La consultation des modèles et des prix fonctionne sans clé ;
la traduction présente d'abord le coût estimé et peut reprendre où elle s'était arrêtée.

## Pourquoi c'est construit ainsi

### Le format est le contrat

Le cœur de Naia ADK n'est pas un outil particulier mais un **format**. La disposition des
répertoires (`.agents/`, `.users/`, `skills/`, `data-*/`) et les schémas de fichiers
(`agents-rules.json`, `SKILL.md`) forment un accord fixe, et tout outil capable de lire cet accord
peut consommer le même workspace. Claude Code, opencode, Codex et naia-agent lisent chacun le même
workspace sans embarquer le code des autres. On peut donc changer d'outil ou en mélanger plusieurs,
et le workspace continue de fonctionner.

L'application des règles elle-même est aussi agnostique aux outils. Un cœur neutre à l'hôte
(`.agents/hooks/core/`) et des politiques (`.agents/hooks/policies/`) pilotent avec les mêmes règles
les hooks Claude Code et l'extension pi.

### Une base personnelle avant de grandir en équipe

Naia ADK est strictement mono-utilisateur, pour un usage personnel. Organigrammes d'entreprise,
règles de tenants et chaînes d'approbation déléguée relèvent d'une couche supérieure. Ce qu'il vous
donne, c'est un endroit unique où écrire la discipline du contexte avant que le workspace ne
grandisse à l'échelle d'une équipe ou d'une entreprise.

Quand la collaboration d'équipe et le savoir partagé deviennent nécessaires, étendez vers
[Naia Business ADK](https://nextain.io/adk). Cette extension élargit la base vers la gouvernance des
actifs, des processus et des permissions, et ajoute la propriété d'équipe et les approbations
déléguées.

### La chaîne de forks

Naia ADK est fait pour être forké et devenir le vôtre. Les particuliers forkent `naia-adk`
directement ; les organisations passent par `naia-business-adk` pour instancier les workspaces de
l'entreprise et des membres.

```
naia-adk                  ← base personnelle (publique, Apache 2.0)
  └── {org}-adk           ← fork d'org : données d'entreprise + sous-modules métier
        └── {user}-adk    ← fork personnel : données personnelles + sous-modules de projets
```

La chaîne réelle de Nextain suit
`naia-adk → naia-business-adk → nextain-adk → alpha-adk`.

## Structure

Le dépôt se divise en code d'exécution (`packages/`), règles et contexte (`.agents/`, `.users/`),
skills (`skills/`, `.agents/skills/`), et les répertoires de données que chaque fork remplit.

| Répertoire | Usage |
|-----------|---------|
| `.agents/` | Contexte destiné à l'IA (anglais, JSON/YAML) — source unique de vérité des règles |
| `.users/` | Miroir lisible par l'humain (coréen, Markdown) |
| `.claude/` | Config Claude Code, hooks, liens symboliques de skills |
| `skills/` | Skills opérationnels/d'exécution (servis par l'API du tableau de bord) |
| `scripts/` | Scripts utilitaires |
| `templates/` | Modèles de documents |
| `docs/` | Docs d'architecture, specs de conception |
| `packages/` | Paquets d'exécution (workspace pnpm) |

### Paquets d'exécution (packages/, 10 au total)

Trois sont de vrais programmes en cours d'exécution ; les autres sont des paquets minces qui
définissent formats et specs.

- `core` — le moteur qui analyse le workspace et les skills.
- `server` — l'API REST/WebSocket Fastify.
- `dashboard` — l'UI du tableau de bord Next.js.
- `skill-spec` — le contrat de format de skill agnostique aux outils (`SkillDescriptor`,
  `SkillLoader`).
- `skills-builtin` — le catalogue de skills génériques.
- `openclaw-compat` — un outil qui migre les skills OpenClaw vers le format naia.
- `persona` — la spec de convention des prompts système.
- `process` — la spec des motifs de workflow (revue → décision → exécution, développement piloté
  par les tickets, etc.).
- `naia-anyllm` — l'adaptateur LLM passerelle any-llm / fournisseurs directs.
- `artifacts-spec` — le schéma standard des artefacts de permission (RBAC) et de cycle de vie
  (SDLC). Il définit 15 types d'artefacts en JSON Schema et précise, pour chacun, si l'instance est
  suivie par git ou limitée à la session.

### Répertoires de données (ignorés par git, remplis par fork)

Ces quatre-là ne sont jamais committés. Celui qui forke le dépôt y met ses propres données.

| Répertoire | Portée | Contenu |
|-----------|-------|---------|
| `data-company/` | Entreprise | Docs à l'échelle de l'entreprise, ressources partagées |
| `data-teams/` | Équipe | Documents d'équipe (stratégie, comptabilité, etc.) |
| `data-private/` | Personnel | Données personnelles, fichiers env, docs privés |
| `projects/` | Personnel | Dépôts de projets (sous-modules) |

### Deux arbres de skills

Les skills vivent à deux endroits, consommés par des parties différentes.

- `.agents/skills/` — skills d'assistance IA et de workflow. Claude Code les utilise via le lien
  symbolique `.claude/skills/`. On y trouve revue (`review-pass`), vérification
  (`verify-implementation`), fusion de worktree (`merge-worktree`), extraction de document
  (`read-doc`), des skills métier comme brevets/droit d'auteur/paie, et d'autres comme
  `finetune-persona`, `secret-vault` et `youtube-upload`.
- `skills/` — skills opérationnels/d'exécution. Le serveur API parcourt `skills/**/SKILL.md` et les
  sert au tableau de bord. Ce sont l'envoi d'e-mails/SMS/notifications, la gestion de canaux, la
  supervision de services et du web, la génération de documents ; `skills/business/` contient des
  skills d'org comme `press-release`.

La liste la plus exacte est le catalogue de skills du tableau de bord. Un tableau texte est aussi
tenu dans [AGENTS.en.md](AGENTS.en.md#skills).

## Prise en main

### Personnel

1. Forkez `naia-adk` sur votre propre compte (privé si possible).
2. Clonez-le : `git clone https://github.com/YOUR-USER/your-adk.git && cd your-adk`
3. Ajoutez l'upstream : `git remote add upstream https://github.com/nextain/naia-template-project.git`
4. Créez les répertoires de données : `mkdir -p data-private projects`
5. Ajoutez des projets, configurez `.agents/`, et commencez à travailler.
6. Si vous utilisez des ressources du compte Naia, définissez `NAIA_KEY` en variable d'environnement.
7. Synchronisez périodiquement : `git fetch upstream && git merge upstream/main`

### Entreprise

1. [Contactez-nous](https://nextain.io/contact) pour accéder à `naia-business-adk`.
2. Forkez `naia-business-adk` en privé sur le compte de l'org, puis clonez-le.
3. Ajoutez l'upstream : `git remote add upstream https://github.com/nextain/naia-business-adk.git`
4. Remplissez les données d'entreprise et les sous-modules de projets : `mkdir -p data-company projects`,
   `git submodule add <repo> projects/<name>`
5. Chaque membre forke à son tour l'ADK de l'org comme workspace personnel.

### Intégration Naia Shell (optionnel)

Si vous utilisez l'appli de bureau [Naia Shell](https://github.com/nextain/naia-shell), pointez son
chemin de workspace vers votre répertoire ADK. Skills et données sont servis via l'API.

## Contribuer

Rédigez tickets, PR et discussions dans la langue où vous êtes à l'aise ; l'IA assure la médiation.
Gardez simplement le dossier git (commits, contexte, artefacts partagés) en anglais. Pour le
processus complet et les règles, voir [CONTRIBUTING.md](CONTRIBUTING.md). Le développement se fait par
défaut en mode piloté par tickets ; le flux détaillé vit dans [AGENTS.en.md](AGENTS.en.md) et
[`.agents/workflows/`](.agents/workflows/).

## Feuille de route

Ce qui suit est prévu, pas une fonction qui marche aujourd'hui.

- **Atomes de connaissance** — le contexte actuel est à base de fichiers, si bien que trouver une
  seule information oblige à charger tout le fichier et gaspille des tokens. L'idée est de briser le
  contexte en unités minimales porteuses de sens, de les relier par des tags, et de ne sortir que le
  morceau exact requis. L'accès passerait par la CLI ou MCP pour rester agnostique aux outils.

## Licence

Apache License 2.0. Voir [LICENSE](LICENSE) pour les détails.

```
Copyright 2026 Nextain Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
```

## Écosystème Naia

- **naia-shell** — [github.com/nextain/naia-shell](https://github.com/nextain/naia-shell) (client shell bureau & web)
- **naia-agent** — [github.com/nextain/naia-agent](https://github.com/nextain/naia-agent) (runtime d'agent & orchestration d'outils)
- **naia-memory** — [github.com/nextain/naia-memory](https://github.com/nextain/naia-memory) (mémoire d'agent persistante)
- **naia-kb-compiler** — [github.com/nextain/naia-kb-compiler](https://github.com/nextain/naia-kb-compiler) (compilateur de base de connaissances pour contexte structuré)
- **naia-adk** — [github.com/nextain/naia-adk](https://github.com/nextain/naia-adk) (kit de développement IA)
- **Nextain** — [nextain.io](https://nextain.io)
- **Naia** — [naia.nextain.io](https://naia.nextain.io)
