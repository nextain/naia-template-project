[English](README.md) | [한국어](README.ko.md) | [日本語](README.ja.md) | [简体中文](README.zh-CN.md) | [Français](README.fr.md) | **Deutsch** | [Русский](README.ru.md) | [Español](README.es.md) | [العربية](README.ar.md) | [हिन्दी](README.hi.md) | [বাংলা](README.bn.md) | [Português](README.pt.md) | [Bahasa Indonesia](README.id.md) | [Tiếng Việt](README.vi.md)

# Naia ADK

**Ein vorab aufgeräumtes Workspace-Gerüst, in dem KI-Coding-Agenten arbeiten.**

Wer KI-Coding-Werkzeuge wie Claude Code oder Codex benutzt, findet Regeldateien bei jedem Tool an
einem anderen Ort, und Fragen wie „Darf dieses Dokument veröffentlicht werden?" oder „Wohin gehören
Skills?" werden ad hoc beantwortet. Naia ADK legt dieses Skelett im Voraus an. So wie man auf einem
neuen Laptop zuerst die Entwicklungsumgebung einrichtet, übergibt es dem KI-Agenten einen
aufgeräumten Schreibtisch zum Start. Dazu gibt es ein Dashboard, das den Workspace-Zustand auf einen
Blick zeigt.

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

## In 5 Minuten startklar

Du brauchst **Node 22+** und **pnpm 9+**.

```bash
pnpm install    # Workspace-Abhängigkeiten installieren
pnpm dev        # API-Server (:3141) und Dashboard (:3142) gemeinsam starten
```

Öffne `http://localhost:3142` im Browser, um das Dashboard zu sehen. Drei Dinge sind sofort sichtbar:

- **Workspace** — Projekte und Submodule, Dateibaum und Offenlegungsstufe jedes Eintrags.
- **Skill-Katalog** — die Liste der in diesem Workspace registrierten Skills und ihre Inhalte.
- **Einstellungen / Monitoring** — Serverkonfiguration, Clientstatus, Datenverzeichnisse.

Das Dashboard leitet `/api/*`-Anfragen an den API-Server auf Port 3141 weiter. Um nur eines von beiden
zu starten, nutze `pnpm dev:server` (→ 3141) oder `pnpm dev:dashboard` (→ 3142). Die
Starter-Skripte `./start.sh` (Linux/macOS) und `start.bat` (Windows) führen beide `pnpm dev` aus. Die
Server-CLI akzeptiert `--port`, `--host` und `--root`; um z. B. auf einen anderen Workspace zu zeigen:
`pnpm serve -- --root /path/to/workspace`.

## Was drin ist

### Das Workspace-Gerüst

Es gibt dem KI-Agenten eine Reihe von Verzeichnissen mit festen Plätzen, sodass er sofort losarbeiten
kann. KI-seitiger Kontext liegt in `.agents/` (Englisch, JSON/YAML), ein menschenlesbarer Spiegel
liegt in `.users/` (Koreanisch, Markdown). Dieser Spiegel ist partiell, keine Vollkopie — er hält die
Dokumente bereit, die ein Mensch lesen muss (z. B. sind Skills unter `.agents/skills/` kanonisch, und
nur einige sind nach `.users/skills/` gespiegelt). Skills, Daten und Projekte haben alle festgelegte
Orte, sodass der Workspace immer gleich aussieht, egal welches Tool ihn öffnet.

### Dashboard und API

Ein Next.js-Dashboard verwaltet den Workspace visuell, getragen von einem Fastify-API-Server. Die API
legt Workspace-Metadaten (`/api/workspace`), den Skill-Katalog (`/api/skills`), Datei-Lesen/Schreiben
(`/api/files`) sowie einen WebSocket offen, der Dateiänderungen streamt (`/api/ws`). Dank dieser API
erreichen auch andere Programme als das Dashboard den Workspace.

### Skillsystem

Wiederkehrende Aufgaben werden als wiederverwendbare Skills gebündelt. Jeder Skill ist durch genau ein
`SKILL.md` definiert, und der API-Server scannt `skills/`, um den Katalog zu bauen. Verletzt auch nur
ein Skill das Format, wirft der ganze Katalog einen Fehler (fail-closed): Statt den kaputten Skill
stillschweigend zu überspringen und den Rest zu servieren, wird der Betreiber gezwungen, ihn auf der
Stelle zu reparieren. Eine bewusste Entscheidung, um nicht versehentlich einen unvollständigen
Katalog auszuliefern.

### Regeln und Mindest-Governance

Selbst ein allein genutzter Workspace braucht minimale Regeln, sobald KI und Automatisierung ihn
anfassen. Naia ADK trennt `read`, `write`, `execute` und `publish` als eigene Belange und hängt an
jedes Dokument eine Offenlegungsstufe. Schwer rückgängig zu machende Aktionen — Produktionsänderungen,
Umgang mit Secrets, öffentliche Aussagen — werden von gewöhnlichen lokalen Edits getrennt und durch
Freigabe-Gates geleitet.

Offenlegung hat vier Stufen. `public` darf unverändert auf eine öffentliche Seite oder in ein
Open-Source-Repo; `controlled` darf nach Review extern geteilt werden; `internal` bleibt innerhalb des
Workspace; `confidential` deckt sensibles Material wie Verträge, Credentials und personenbezogene
Daten ab. Credentials liegen meist außerhalb von git, sind aber der Stufe nach trotzdem
`confidential`.

> **Die Session-Vertrags-Durchsetzung ist in diesem Release abgeschaltet.** Ein
> `.claude/no-harness`-Marker ist committet, sodass das Session-Vertrags-Gate nichts blockiert. Wäre
> es an, wäre eine Session ohne Vertrag für jeden mutierenden Shell-Befehl blockiert — einschließlich
> `npm test` —, sodass ein frischer Klon nicht einmal seine eigene Testsuite laufen lassen könnte. Der
> Datei-Edit-Pfad wurde aus demselben Grund geöffnet; der Shell-Pfad hat dieselbe Behandlung noch
> nicht erhalten. Force-Push-, destruktive-git-, Deploy- und Outbound-Messaging-Guards sind davon
> unberührt und laufen weiter. Fortschritt wird in
> [#34](https://github.com/nextain/naia-template-project/issues/34) verfolgt, Details stehen in
> `.claude/no-harness`. Der Abschnitt „Session Boundaries" in `AGENTS.md` beschreibt das beabsichtigte
> Design, nicht das aktuelle Laufzeitverhalten.

### LLM-Adapter (naia-anyllm)

Für Funktionen, die ein LLM erreichen müssen, ist der `naia-anyllm`-Adapter eingebaut. Er verbindet
sich über das [any-llm](https://github.com/nextain/any-llm)-Gateway oder direkt mit Providern wie
OpenAI, Anthropic und Google. Standard ist ein Naia-Konto: Lege einen unter
[naia.nextain.io](https://naia.nextain.io) ausgestellten Schlüssel in die Umgebungsvariable `NAIA_KEY`,
und du kannst sofort deine Kontoguthaben nutzen. Ohne Schlüssel wirft er vor jedem kostenpflichtigen
Aufruf einen Fehler. Um Provider oder Modelle zu wechseln, kopiere
[`.agents/context/llm-config.yaml.example`](.agents/context/llm-config.yaml.example) und halte
API-Schlüssel in Umgebungsvariablen oder dem Keystore des Betriebssystems, nicht in der
Konfigurationsdatei. `naia-settings/llm.json` zeichnet nur `apiKeyRef: "NAIA_KEY"` auf, niemals den
Schlüsselwert. Braucht ein persönlicher Fork langfristige Sicherung, nutze den age-verschlüsselten
Vault in `data-private/key/` (siehe [`.env.example`](.env.example)).

Zum Auflisten unterstützter Modelle und aktueller Preise sowie zum Übersetzen langer PDFs nutze den
Skill `translate-doc`. Modell- und Preisabfragen gehen ohne Schlüssel; die Übersetzung zeigt zuerst
die geschätzten Kosten und kann dort fortsetzen, wo sie stehen geblieben ist.

## Warum es so gebaut ist

### Das Format ist der Vertrag

Das Herz von Naia ADK ist nicht ein bestimmtes Tool, sondern ein **Format**. Das
Verzeichnislayout (`.agents/`, `.users/`, `skills/`, `data-*/`) und die Dateischemen
(`agents-rules.json`, `SKILL.md`) sind eine feste Vereinbarung, und jedes Tool, das diese
Vereinbarung lesen kann, kann denselben Workspace konsumieren. Claude Code, opencode, Codex und
naia-agent lesen jeder denselben Workspace, ohne den Code der anderen einzubetten. Man kann also
Tools wechseln oder mehrere mischen, und der Workspace funktioniert weiter.

Die Regeldurchsetzung selbst ist ebenfalls tool-agnostisch. Ein hostneutraler Kern
(`.agents/hooks/core/`) und Policies (`.agents/hooks/policies/`) treiben sowohl die Claude-Code-Hooks
als auch die pi-Erweiterung mit denselben Regeln an.

### Eine persönliche Basis, bevor sie zum Team heranwächst

Naia ADK ist strikt Single-User, für den persönlichen Gebrauch. Firmen-Orgcharts, Tenant-Regeln und
delegierte Freigabeketten gehören in eine höhere Schicht. Was es dir gibt, ist ein einziger Ort, um
Kontextdisziplin festzuschreiben, bevor der Workspace zu Team- oder Firmengröße heranwächst.

Wenn Teamzusammenarbeit und geteiltes Wissen nötig werden, erweitere auf
[Naia Business ADK](https://nextain.io/adk). Diese Erweiterung weitet die Baseline auf Asset-,
Prozess- und Berechtigungs-Governance aus und fügt Team-Ownership und delegierte Freigaben hinzu.

### Die Fork-Kette

Naia ADK ist dazu gedacht, in dein eigenes geforkt zu werden. Einzelpersonen forken `naia-adk`
direkt; Organisationen gehen über `naia-business-adk`, um Firmen- und Mitglieder-Workspaces zu
instanziieren.

```
naia-adk                  ← persönliche Basis (öffentlich, Apache 2.0)
  └── {org}-adk           ← Org-Fork: Firmendaten + Business-Submodule
        └── {user}-adk    ← persönlicher Fork: persönliche Daten + Projekt-Submodule
```

Nextains reale Kette läuft `naia-adk → naia-business-adk → nextain-adk → alpha-adk`.

## Struktur

Das Repository teilt sich in Laufzeitcode (`packages/`), Regeln und Kontext (`.agents/`, `.users/`),
Skills (`skills/`, `.agents/skills/`) sowie die Datenverzeichnisse, die jeder Fork befüllt.

| Verzeichnis | Zweck |
|-----------|---------|
| `.agents/` | KI-seitiger Kontext (Englisch, JSON/YAML) — Single Source of Truth für Regeln |
| `.users/` | Menschenlesbarer Spiegel (Koreanisch, Markdown) |
| `.claude/` | Claude-Code-Konfiguration, Hooks, Skill-Symlinks |
| `skills/` | Operative/Laufzeit-Skills (vom Dashboard-API serviert) |
| `scripts/` | Hilfsskripte |
| `templates/` | Dokumentvorlagen |
| `docs/` | Architekturdokumente, Designspezifikationen |
| `packages/` | Laufzeitpakete (pnpm-Workspace) |

### Laufzeitpakete (packages/, 10 Stück)

Drei sind tatsächlich laufende Programme; der Rest sind schlanke Pakete, die Formate und Specs
definieren.

- `core` — die Engine, die Workspace und Skills parst.
- `server` — die Fastify-REST/WebSocket-API.
- `dashboard` — die Next.js-Dashboard-UI.
- `skill-spec` — der tool-agnostische Skill-Formatvertrag (`SkillDescriptor`, `SkillLoader`).
- `skills-builtin` — der generische Skill-Katalog.
- `openclaw-compat` — ein Tool, das OpenClaw-Skills ins naia-Format migriert.
- `persona` — die System-Prompt-Konventionsspec.
- `process` — die Workflow-Musterspec (Review → Entscheiden → Ausführen, Issue-getriebene
  Entwicklung usw.).
- `naia-anyllm` — der any-llm-Gateway-/Direkt-Provider-LLM-Adapter.
- `artifacts-spec` — das Standardschema für Berechtigungs- (RBAC) und
  Entwicklungslebenszyklus- (SDLC) Artefakte. Es definiert 15 Artefakttypen als JSON Schema und legt
  für jeden fest, ob die Instanz git-getrackt oder session-scoped ist.

### Datenverzeichnisse (gitignored, pro Fork befüllt)

Diese vier werden nie committet. Wer das Repo forkt, legt seine eigenen Daten hinein.

| Verzeichnis | Umfang | Inhalt |
|-----------|-------|---------|
| `data-company/` | Firma | Firmenweite Dokumente, geteilte Ressourcen |
| `data-teams/` | Team | Teamdokumente (Strategie, Rechnungswesen usw.) |
| `data-private/` | Persönlich | Persönliche Daten, env-Dateien, private Dokumente |
| `projects/` | Persönlich | Projektrepos (Submodule) |

### Zwei Skill-Bäume

Skills liegen an zwei Orten, konsumiert von unterschiedlichen Parteien.

- `.agents/skills/` — KI-Assistenz- und Workflow-Skills. Claude Code nutzt sie über den
  `.claude/skills/`-Symlink. Enthält Review (`review-pass`), Verifikation (`verify-implementation`),
  Worktree-Merge (`merge-worktree`), Dokumentextraktion (`read-doc`), Business-Skills wie
  Patent/Urheberrecht/Gehaltsabrechnung sowie weitere wie `finetune-persona`, `secret-vault` und
  `youtube-upload`.
- `skills/` — operative/Laufzeit-Skills. Der API-Server scannt `skills/**/SKILL.md` und serviert sie
  dem Dashboard. Dazu gehören E-Mail/SMS/Benachrichtigungsversand, Kanalverwaltung, Service- und
  Webmonitoring sowie Dokumenterzeugung; `skills/business/` hält Org-Skills wie `press-release`.

Die genaueste Liste ist der Skill-Katalog im Dashboard. Eine Texttabelle steht auch in
[AGENTS.en.md](AGENTS.en.md#skills).

## Erste Schritte

### Persönlich

1. Forke `naia-adk` in deinen eigenen Account (wenn möglich privat).
2. Klone es: `git clone https://github.com/YOUR-USER/your-adk.git && cd your-adk`
3. Füge das Upstream hinzu: `git remote add upstream https://github.com/nextain/naia-template-project.git`
4. Lege Datenverzeichnisse an: `mkdir -p data-private projects`
5. Füge Projekte hinzu, konfiguriere `.agents/` und lege los.
6. Wenn du Naia-Kontoressourcen nutzt, setze `NAIA_KEY` als Umgebungsvariable.
7. Synchronisiere regelmäßig: `git fetch upstream && git merge upstream/main`

### Firma

1. [Kontaktiere uns](https://nextain.io/contact) für Zugang zu `naia-business-adk`.
2. Forke `naia-business-adk` privat in deinen Org-Account und klone es dann.
3. Füge das Upstream hinzu: `git remote add upstream https://github.com/nextain/naia-business-adk.git`
4. Befülle Firmendaten und Projekt-Submodule: `mkdir -p data-company projects`,
   `git submodule add <repo> projects/<name>`
5. Jedes Mitglied forkt den Org-ADK erneut als persönlichen Workspace.

### Naia-Shell-Integration (optional)

Wenn du die Desktop-App [Naia Shell](https://github.com/nextain/naia-shell) nutzt, zeige ihren
Workspace-Pfad auf dein ADK-Verzeichnis. Skills und Daten werden über die API serviert.

## Mitwirken

Schreibe Issues, PRs und Diskussionen in der Sprache, in der du dich wohlfühlst; die KI vermittelt die
Kommunikation. Halte nur den git-Datensatz (Commits, Kontext, geteilte Artefakte) auf Englisch. Für
den vollen Prozess und die Regeln siehe [CONTRIBUTING.md](CONTRIBUTING.md). Entwicklung läuft
standardmäßig Issue-getrieben; der detaillierte Fluss lebt in [AGENTS.en.md](AGENTS.en.md) und
[`.agents/workflows/`](.agents/workflows/).

## Roadmap

Das Folgende ist geplant, kein Feature, das heute funktioniert.

- **Wissensatome** — heutiger Kontext ist dateibasiert, sodass schon das Finden einer einzigen
  Information das Laden der ganzen Datei erfordert und Tokens verschwendet. Die Idee: Kontext in die
  kleinsten bedeutungstragenden Einheiten zerbrechen, mit Tags verlinken und genau das benötigte
  Stück herausziehen. Zugriff ginge über CLI oder MCP, damit es tool-agnostisch bleibt.

## Lizenz

Apache License 2.0. Details siehe [LICENSE](LICENSE).

```
Copyright 2026 Nextain Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
```

## Naia-Ökosystem

- **naia-shell** — [github.com/nextain/naia-shell](https://github.com/nextain/naia-shell) (Desktop- & Web-Shell-Client)
- **naia-agent** — [github.com/nextain/naia-agent](https://github.com/nextain/naia-agent) (Agenten-Runtime & Tool-Orchestrierung)
- **naia-memory** — [github.com/nextain/naia-memory](https://github.com/nextain/naia-memory) (persistenter Agentenspeicher)
- **naia-kb-compiler** — [github.com/nextain/naia-kb-compiler](https://github.com/nextain/naia-kb-compiler) (Wissensbasis-Compiler für strukturierten Kontext)
- **naia-adk** — [github.com/nextain/naia-adk](https://github.com/nextain/naia-adk) (KI-Entwicklungs-Kit)
- **Nextain** — [nextain.io](https://nextain.io)
- **Naia** — [naia.nextain.io](https://naia.nextain.io)
