#!/usr/bin/env node
/** users-index-model — `.users/` 의 skills/hooks/commands 는 **단일 색인(*-list.md)** 모델이어야 한다.
 *  per-item 복사 디렉터리(`.users/skills/`, `.users/hooks/`, `.users/commands/`)는 **위반**
 *  (중복·drift 원인 — skills 는 .agents/skills 가 SoT, 사람용은 색인 한 장).
 *  + gen-skills-list 결정론 검증 + skills-list.md 가 생성기 출력과 일치. */
import { existsSync, statSync, readFileSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";
import { buildSkillsList } from "../../scripts/gen-skills-list.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const isDir = (p) => existsSync(p) && statSync(p).isDirectory();

let pass = 0, fail = 0;
const check = (n, c) => { console.log(`${c ? "✅ PASS" : "❌ FAIL"} — ${n}`); c ? pass++ : fail++; };

const KINDS = ["skills", "hooks", "commands"];

// 1) per-item 복사 디렉터리 금지 (잘못된 모델 — 하네스가 잡아야 한다)
for (const k of KINDS) {
	check(`.users/${k}/ per-item 디렉터리 없음 (색인 모델 위반 아님)`, !isDir(join(ROOT, ".users", k)));
}

// 2) 단일 색인 *-list.md 존재
for (const k of KINDS) {
	check(`.users/${k}-list.md 색인 존재`, existsSync(join(ROOT, ".users", `${k}-list.md`)));
}

// 3) skills-list.md = 생성기 결정론 출력과 일치 (drift 0)
{
	const out = join(ROOT, ".users/skills-list.md");
	const cur = existsSync(out) ? readFileSync(out, "utf8") : "";
	const gen = buildSkillsList(join(ROOT, ".agents/skills"));
	check("skills-list.md 가 gen-skills-list 출력과 일치(최신)", cur === gen);
}

// 4) buildSkillsList 결정론 — 스킬 없는 디렉터리 → '없음' 행
{
	const empty = buildSkillsList(join(ROOT, "node_modules", "__nope__"));
	check("스킬 디렉터리 부재 → '없음' 표 (크래시 아님)", /등록된 스킬 없음/.test(empty));
}

console.log(`\n결과: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
