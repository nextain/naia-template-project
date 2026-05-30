#!/usr/bin/env node
/**
 * cleanse-scan — 구조 *진위/완성도* 진단 (기존 게이트가 못 보는 P1~P6 를 RED 로).
 *
 * 동기: enforce/doc-graph/verify-watch/make 는 *도달가능·통과*만 본다. placeholder·빈 stub·
 *   deprecated 묘비·가짜 QA·중복 스키마가 다 green 으로 통과한다(2026-05-30 실패 회차 실증).
 *   이 도구는 *실질/진위*를 본다 — "선언 ≠ 관측" 일반 술어로(단계명 하드코딩 없음).
 *
 * 검출 (각 = RED 후보, *지표*이지 증명 아님 — 사람/패널 검토용):
 *   T1 tombstone     : 'DEPRECATED' 마킹된 채 남은 문서 (격리/제거 안 됨)
 *   T2 stub          : docs/ 산출물 위치인데 실질 내용 미달(보일러플레이트 제외 N줄 미만)
 *   T3 dual-scheme   : 경쟁 조직 스키마 공존 (SDLC 단계형 NN-* + 방법론형 contracts/rounds)
 *   T4 fake-qa       : 테스트 단언이 거의 return값/non-null (핵심 결과 미검증 의심)
 *
 * 사용: node scripts/cleanse-scan.mjs [project-root]   (기본 cwd)
 * exit 0 = 깨끗 / 1 = RED(검출). ESM, 의존성 0.
 */
import fs from "fs";
import path from "path";

const ROOT = path.resolve(process.argv[2] || process.cwd());
const SUBSTANTIVE_MIN = 8; // 보일러플레이트 제외 실질 줄 하한
const BOILERPLATE = /^(#|>|\||---|\s*$|\s*[-*]\s*$|deprecated|⚠|gate\s*\d)/i;

function walk(dir, filter) {
	const out = [];
	if (!fs.existsSync(dir)) return out;
	for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, e.name);
		if (e.isDirectory()) {
			if (/node_modules|\.git|quarantine/.test(e.name)) continue;
			out.push(...walk(p, filter));
		} else if (filter(p)) out.push(p);
	}
	return out;
}
const rel = (p) => path.relative(ROOT, p);
const substantiveLines = (txt) => txt.split("\n").filter((l) => !BOILERPLATE.test(l.trim()) && l.trim().length > 3).length;

const findings = { T1: [], T2: [], T3: [], T4: [] };

// T1/T2 — docs/ 의 tombstone + stub
const docs = walk(path.join(ROOT, "docs"), (p) => p.endsWith(".md") && !/\/(progress|rounds|candidates|archive)\//.test(p));
for (const f of docs) {
	const txt = fs.readFileSync(f, "utf8");
	if (/deprecated/i.test(txt)) findings.T1.push(rel(f));
	else if (substantiveLines(txt) < SUBSTANTIVE_MIN && path.basename(f) !== "README.md") findings.T2.push(`${rel(f)} (${substantiveLines(txt)}줄)`);
}

// T3 — 경쟁 스키마 공존
const hasSdlcPhases = fs.existsSync(path.join(ROOT, "docs")) &&
	fs.readdirSync(path.join(ROOT, "docs")).filter((d) => /^\d\d-/.test(d)).length >= 3;
const hasMethodology = ["contracts", "candidates", "rounds"].filter((d) => fs.existsSync(path.join(ROOT, "docs", d))).length >= 2;
if (hasSdlcPhases && hasMethodology) findings.T3.push("SDLC 단계형(NN-*) + 방법론형(contracts/candidates/rounds) 공존");

// T4 — fake-qa 휴리스틱 (C/JS 테스트: 단언이 return/non-null 위주)
const tests = walk(ROOT, (p) => /(test_.*\.c|\.test\.(c|mjs|js|ts))$/.test(p) && !/\/(node_modules)\//.test(p));
for (const f of tests) {
	const txt = fs.readFileSync(f, "utf8");
	const trivial = (txt.match(/!=\s*NULL|==\s*NULL|!=\s*0\b|==\s*0\b|return\s+0/g) || []).length;
	const valueChecks = (txt.match(/==\s*(?!0\b|NULL)[\w'"]|memcmp|strcmp|assert_eq|toBe\(|expect\(/g) || []).length;
	// 핵심 도메인 값 검증이 trivial 대비 현저히 적으면 가짜 QA 의심
	if (trivial >= 5 && valueChecks < trivial / 2) findings.T4.push(`${rel(f)} (trivial 단언 ${trivial} vs 값검증 ${valueChecks})`);
}

const total = Object.values(findings).reduce((a, b) => a + b.length, 0);
const LABEL = { T1: "tombstone(DEPRECATED 잔존)", T2: "stub(빈 산출물)", T3: "dual-scheme(경쟁 스키마)", T4: "fake-qa(핵심 미검증 의심)" };
console.log(`[cleanse-scan] ${rel(ROOT) || "."} — RED 후보 ${total}건\n`);
for (const k of ["T1", "T2", "T3", "T4"]) {
	if (!findings[k].length) continue;
	console.log(`■ ${k} ${LABEL[k]} (${findings[k].length})`);
	for (const x of findings[k]) console.log(`   - ${x}`);
}
if (total === 0) console.log("깨끗 — 진위/완성도 RED 후보 없음.");
console.log(`\n※ 지표(휴리스틱)다. 각 항목은 사람/패널 검토로 확정. 격리는 quarantine.mjs.`);
process.exit(total ? 1 : 0);
