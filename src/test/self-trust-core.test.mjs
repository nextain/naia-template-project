#!/usr/bin/env node
/** self-trust 공통 코어 단위 테스트. 실행: node src/test/self-trust-core.test.mjs */
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync } from "fs";
import { tmpdir } from "os";
import { join, dirname } from "path";
import { loadConfig, checkCompletion, checkDocumentationImpact, checkSdlc, checkStructure, normalizeRel, isCharterFile, extractEvidenceRefs } from "../../.agents/hooks/lib/self-trust-core.mjs";

const CONFIG = {
	enforcement_level: "enforced",
	completion: {
		keywords: ["완료", "통과", "done", "complete", "completed", "shipped", "CLEAN", "完了"],
		negations: ["미완료", "incomplete", "WIP", "wip", "未完"],
		evidence_patterns: ["Verified:", "Evidence:", "closes #", "sha256"],
	},
	change_set_rules: [
		{ id: "src", when_changed_glob: ["src/main/**", "src/**/*.{js,py}"], requires: ["docs/user-scenarios.md", "docs/requirements.md"], exempt_glob: ["**/*.test.*", "docs/**"] },
	],
	documentation_impact_gate: {
		enabled: true,
		when_changed_glob: ["src/main/**"],
		exempt_glob: ["**/*.test.*"],
		receipt_glob: "docs/progress/99.dev-comm/issue-*-documentation-impact.json",
		required_targets: ["repository_docs", "user_manual", "reusable_learning"],
		target_evidence_glob: {
			repository_docs: ["README.md", "docs/**"],
			user_manual: ["docs/manual/**", ".users/**"],
			reusable_learning: ["AGENTS.md", "docs/lessons/**"],
		},
		na_rationale_min_chars: 30,
		na_rationale_placeholder_phrases: ["not relevant", "not applicable", "no impact", "none", "n/a", "관련 없음", "해당 없음", "없음"],
	},
	artifact_min_meaningful_chars: 100,
};
const LONG = "x".repeat(120);

function setupRoot(files = {}) {
	const d = mkdtempSync(join(tmpdir(), "core-"));
	const rules = {
		F12: { allowed_root_dirs: [".agents", ".claude", "docs", "scripts", "src"] },
		F13: { allowed_root_files: ["AGENTS.md", "README.md"] },
		charter_immutability: { charter_files: ["AGENTS.md", ".agents/context/agents-rules.json"] },
		self_trust_config: CONFIG,
	};
	const rp = join(d, ".agents/context/agents-rules.json");
	mkdirSync(dirname(rp), { recursive: true });
	writeFileSync(rp, JSON.stringify(rules));
	for (const [p, c] of Object.entries(files)) {
		const fp = join(d, p);
		mkdirSync(dirname(fp), { recursive: true });
		writeFileSync(fp, c);
	}
	return d;
}

let pass = 0, fail = 0;
function check(name, cond) { console.log(`${cond ? "✅ PASS" : "❌ FAIL"} — ${name}`); cond ? pass++ : fail++; }

const root = setupRoot();
const cfg = loadConfig(root);

// checkCompletion — 다국어·부정문·증거
check("한국어 '완료'+증거없음 → 실패", checkCompletion("로그인 수정 완료", cfg).ok === false);
check("일본어 '完了'+증거없음 → 실패(CJK 부분일치)", checkCompletion("ログイン修正 完了", cfg).ok === false);
check("영어 'shipped'+증거없음 → 실패", checkCompletion("feat: shipped the feature", cfg).ok === false);
check("'완료'+Verified → 통과", checkCompletion("완료\n\nVerified: test.json", cfg).ok === true);
check("'미완료'(부정문) → 통과", checkCompletion("로그인 미완료 상태", cfg).ok === true);
check("'WIP' → 통과(negation)", checkCompletion("WIP: 작업중", cfg).ok === true);
check("'incomplete'는 negation, 'complete' 단어경계 오탐 안 함 → 통과", checkCompletion("this is incomplete", cfg).ok === true);
check("완료선언 없음 → 통과", checkCompletion("chore: 설정 변경", cfg).ok === true);
check("'closes #5' 증거 → 통과", checkCompletion("끝. closes #5", cfg).ok === true);

// off level
check("enforcement off → 항상 통과", checkCompletion("완료", { ...cfg, level: "off" }).ok === true);

// 글로브 **/ = 0개 이상 dir (최상위 src/*.c 도 매칭 — 사이클#5 드리프트 수정)
{
	const r = setupRoot({});
	const c = { ...loadConfig(r), changeSetRules: [{ id: "p", when_changed_glob: ["src/**/*.c"], requires: ["docs/r.md"], exempt_glob: ["**/*.test.*"] }] };
	check("src/**/*.c 가 최상위 src/main.c 매칭 (**/ =0dir)", checkSdlc(["src/main.c"], r, c).status !== "n/a");
	check("src/**/*.c 가 중첩 src/x/y.c 매칭", checkSdlc(["src/x/y.c"], r, c).status !== "n/a");
	check("**/*.test.* 가 최상위 foo.test.mjs exempt", checkSdlc(["foo.test.mjs"], r, c).status === "n/a");
}

// 증거 등급(tier) — 드리프트(placeholder가 키워드로 통과) 대응
const tierCfg = { ...cfg, completion: { ...cfg.completion, strong_evidence_patterns: ["review-pass:", ".agents/reviews/", "acceptance:"] } };
check("강한 증거(review-pass 인용) → tier=strong", checkCompletion("완료\n\nreview-pass: CLEAN (.agents/reviews/r-1.json)", tierCfg).tier === "strong");
check("강한 증거(acceptance 명령) → tier=strong", checkCompletion("done\n\nacceptance: verify_glyphs.py → 0", tierCfg).tier === "strong");
check("약한 증거(키워드만) → ok=true + tier=weak", (() => { const r = checkCompletion("완료\n\nVerified: log", tierCfg); return r.ok === true && r.tier === "weak"; })());
check("증거 없음 → ok=false + tier=none", (() => { const r = checkCompletion("완료", tierCfg); return r.ok === false && r.tier === "none"; })());
check("강+약 공존 → strong 우선", checkCompletion("완료 Verified: x  review-pass: CLEAN", tierCfg).tier === "strong");

// Evidence Reference Validation (적대검증 교훈) — 인용 아티팩트가 실제 존재해야 strong
check("extractEvidenceRefs: .agents/reviews 경로 추출", extractEvidenceRefs("review-pass: .agents/reviews/r-1.json").includes(".agents/reviews/r-1.json"));
check("extractEvidenceRefs: json/md 경로 추출", extractEvidenceRefs("acceptance: tools/verify.json 통과").includes("tools/verify.json"));
{
	const msg = "완료\n\nreview-pass: CLEAN (.agents/reviews/r-1.json)";
	const existsAll = () => true, existsNone = () => false;
	check("강 인용 + 파일존재 → strong", checkCompletion(msg, tierCfg, { fileExists: existsAll }).tier === "strong");
	const r = checkCompletion(msg, tierCfg, { fileExists: existsNone });
	check("강 인용했으나 파일부재 → weak 강등 + note", r.tier === "weak" && r.note === "cited-ref-missing");
	check("fileExists 미주입 시 패턴기반 strong (하위호환)", checkCompletion(msg, tierCfg).tier === "strong");
	// 위조 시나리오: 파일 경로 없이 'review-pass: CLEAN' 만 → fileExists 주입 시 weak 강등(위조 차단)
	check("경로 없는 'review-pass: CLEAN' + fileExists → weak(위조 차단)", checkCompletion("완료 review-pass: CLEAN", tierCfg, { fileExists: existsNone }).tier === "weak");
}

// checkSdlc — 글롭
const full = setupRoot({ "docs/user-scenarios.md": "## UC-1\n" + LONG, "docs/requirements.md": "## FR-1\n" + LONG });
const cfgFull = loadConfig(full);
const empty = setupRoot();
const cfgEmpty = loadConfig(empty);
check("src/main/a.js + UC·REQ → ok", checkSdlc(["src/main/a.js"], full, cfgFull).status === "ok");
check("src/main/a.py (글롭 src/**/*.{js,py}) + 산출물없음 → bootstrap", checkSdlc(["src/main/a.py"], empty, cfgEmpty).status === "bootstrap");
check("src/main/a.test.js (exempt) → n/a", checkSdlc(["src/main/a.test.js"], empty, cfgEmpty).status === "n/a");
check("docs만 변경 → n/a", checkSdlc(["docs/x.md", "README.md"], empty, cfgEmpty).status === "n/a");
{
	const partial = setupRoot({ "docs/user-scenarios.md": "## UC-1\n" + LONG });
	check("UC만(부분) → violation", checkSdlc(["src/main/a.js"], partial, loadConfig(partial)).status === "violation");
}
check("min_chars 미달(짧은 산출물) → bootstrap 취급", checkSdlc(["src/main/a.js"], setupRoot({ "docs/user-scenarios.md": "짧음", "docs/requirements.md": "짧음" }), cfg).status === "bootstrap");

// Documentation impact receipt — every audience must be decided with verifiable evidence.
const receiptPath = "docs/progress/99.dev-comm/issue-42-documentation-impact.json";
const receipt = (targets, production_files = ["src/main/a.js"]) => JSON.stringify({
	schema_version: 1,
	issue: 42,
	production_files,
	targets,
});
{
	const targets = {
		repository_docs: { status: "UPDATED", evidence: ["docs/requirements.md"] },
		user_manual: { status: "N/A", rationale: "This internal behavior has no user-facing setup or operation change." },
		reusable_learning: { status: "UPDATED", evidence: ["https://github.com/nextain/book/commit/1234567890abcdef1234567890abcdef12345678"] },
	};
	const r = setupRoot({ [receiptPath]: receipt(targets), "docs/requirements.md": LONG });
	const files = ["src/main/a.js", receiptPath, "docs/requirements.md"];
	check("세 대상 UPDATED/N/A + 변경/고정 증거 → ok", checkDocumentationImpact(files, r, loadConfig(r)).status === "ok");
	check("프로덕션 변경 + receipt 미변경 → violation", checkDocumentationImpact(["src/main/a.js", "docs/requirements.md"], r, loadConfig(r)).status === "violation");
}
{
	const targets = {
		repository_docs: { status: "UPDATED", evidence: ["README.md"] },
		user_manual: { status: "N/A", rationale: "짧음" },
	};
	const r = setupRoot({ [receiptPath]: receipt(targets), "README.md": LONG });
	const result = checkDocumentationImpact(["src/main/a.js", receiptPath], r, loadConfig(r));
	check("대상 누락·짧은 N/A·diff 밖 local evidence → violation", result.status === "violation" && result.reasons.length >= 3);
}
{
	const repeatedPlaceholder = "not relevant not relevant not relevant";
	const targets = {
		repository_docs: { status: "N/A", rationale: repeatedPlaceholder },
		user_manual: { status: "N/A", rationale: repeatedPlaceholder },
		reusable_learning: { status: "N/A", rationale: repeatedPlaceholder },
	};
	const r = setupRoot({ [receiptPath]: receipt(targets) });
	const result = checkDocumentationImpact(["src/main/a.js", receiptPath], r, loadConfig(r));
	check("30자 이상 반복 N/A placeholder → violation", result.status === "violation" && result.reasons.some((reason) => reason.includes("repeat a placeholder")));
}
{
	const mixedPlaceholders = "not relevant none not applicable";
	const targets = {
		repository_docs: { status: "N/A", rationale: mixedPlaceholders },
		user_manual: { status: "N/A", rationale: mixedPlaceholders },
		reusable_learning: { status: "N/A", rationale: mixedPlaceholders },
	};
	const r = setupRoot({ [receiptPath]: receipt(targets) });
	const result = checkDocumentationImpact(["src/main/a.js", receiptPath], r, loadConfig(r));
	check("30자 이상 혼합 N/A placeholder → violation", result.status === "violation" && result.reasons.some((reason) => reason.includes("repeat a placeholder")));
}
{
	const concreteRationale = "Not relevant to users because this test-only change does not alter setup, operation, or limitations.";
	const targets = {
		repository_docs: { status: "N/A", rationale: concreteRationale },
		user_manual: { status: "N/A", rationale: concreteRationale },
		reusable_learning: { status: "N/A", rationale: concreteRationale },
	};
	const r = setupRoot({ [receiptPath]: receipt(targets) });
	check("placeholder phrase를 포함한 구체적 설명 → ok", checkDocumentationImpact(["src/main/a.js", receiptPath], r, loadConfig(r)).status === "ok");
}
{
	const targets = {
		repository_docs: { status: "PENDING" },
		user_manual: { status: "N/A", rationale: "There is no user-visible setup, operation, or limitation change in this test-only update." },
		reusable_learning: { status: "N/A", rationale: "The change adds no reusable principle and only updates an existing fixture value." },
	};
	const r = setupRoot({ [receiptPath]: receipt(targets) });
	check("가짜 상태 PENDING → violation", checkDocumentationImpact(["src/main/a.js", receiptPath], r, loadConfig(r)).status === "violation");
	check("테스트 전용 변경 → n/a", checkDocumentationImpact(["src/main/a.test.js"], r, loadConfig(r)).status === "n/a");
}
{
	const targets = {
		repository_docs: { status: "UPDATED", evidence: ["https://github.com/nextain/docs/commit/1234567"] },
		user_manual: { status: "N/A", rationale: "There is no user-facing setup or operation change in this internal-only update." },
		reusable_learning: { status: "N/A", rationale: "No reusable engineering lesson was introduced by this narrowly scoped internal update." },
	};
	const wrongIssuePath = "docs/progress/99.dev-comm/issue-41-documentation-impact.json";
	const r = setupRoot({ [wrongIssuePath]: receipt(targets) });
	const result = checkDocumentationImpact(["src/main/a.js", wrongIssuePath], r, loadConfig(r));
	check("filename/issue 불일치 + 짧은 commit SHA → violation", result.status === "violation" && result.reasons.length >= 2);
}
{
	const targets = {
		repository_docs: { status: "UPDATED", evidence: ["AGENTS.md"] },
		user_manual: { status: "UPDATED", evidence: ["AGENTS.md"] },
		reusable_learning: { status: "UPDATED", evidence: ["AGENTS.md"] },
	};
	const r = setupRoot({ [receiptPath]: receipt(targets), "AGENTS.md": LONG });
	const result = checkDocumentationImpact(["src/main/a.js", "AGENTS.md", receiptPath], r, loadConfig(r));
	check("대상 경로가 틀리고 같은 evidence 재사용 → violation", result.status === "violation" && result.reasons.some((x) => x.includes("reused")));
}
{
	const targets = {
		repository_docs: { status: "UPDATED", evidence: ["docs/requirements.md"] },
		user_manual: { status: "N/A", rationale: "There is no user-facing setup or operation change in this internal-only update." },
		reusable_learning: { status: "N/A", rationale: "No reusable engineering lesson was introduced by this internal-only update." },
	};
	const r = setupRoot({ [receiptPath]: receipt(targets, ["src/main/other.js"]), "docs/requirements.md": LONG });
	check("production_files가 실제 변경 source와 다름 → violation", checkDocumentationImpact(["src/main/a.js", "docs/requirements.md", receiptPath], r, loadConfig(r)).status === "violation");
}
{
	const targets = {
		repository_docs: { status: "UPDATED", evidence: ["docs/lessons/a.md"] },
		user_manual: { status: "N/A", rationale: "There is no user-facing operation, setup, privacy, or limitation change in this update." },
		reusable_learning: { status: "UPDATED", evidence: ["./docs/lessons/a.md"] },
	};
	const r = setupRoot({ [receiptPath]: receipt(targets), "docs/lessons/a.md": LONG });
	const result = checkDocumentationImpact(["src/main/a.js", "docs/lessons/a.md", receiptPath], r, loadConfig(r));
	check("같은 local evidence의 ./ alias 재사용 → violation", result.status === "violation" && result.reasons.some((x) => x.includes("reused")));
}
{
	const commit = "https://github.com/nextain/docs/commit/1234567890abcdef1234567890abcdef12345678";
	const targets = {
		repository_docs: { status: "UPDATED", evidence: [`${commit}#readme`] },
		user_manual: { status: "N/A", rationale: "There is no user-facing operation, setup, privacy, or limitation change in this update." },
		reusable_learning: { status: "UPDATED", evidence: [`${commit}#chapter`] },
	};
	const r = setupRoot({ [receiptPath]: receipt(targets) });
	const result = checkDocumentationImpact(["src/main/a.js", receiptPath], r, loadConfig(r));
	check("같은 external commit의 fragment alias 재사용 → violation", result.status === "violation" && result.reasons.some((x) => x.includes("reused")));
}
{
	const targets = {
		repository_docs: { status: "UPDATED", evidence: ["docs/requirements.md", "not-in-diff.md"] },
		user_manual: { status: "N/A", rationale: "There is no user-facing operation, setup, privacy, or limitation change in this update." },
		reusable_learning: { status: "N/A", rationale: "No reusable engineering lesson was introduced by this internal-only update." },
	};
	const r = setupRoot({ [receiptPath]: receipt(targets), "docs/requirements.md": LONG });
	check("valid evidence 하나가 invalid extra를 숨기지 못함", checkDocumentationImpact(["src/main/a.js", "docs/requirements.md", receiptPath], r, loadConfig(r)).status === "violation");
}
{
	const r = setupRoot();
	const target = join(r, "outside-receipt.json");
	writeFileSync(target, receipt({
		repository_docs: { status: "UPDATED", evidence: ["src/main/a.js"] },
		user_manual: { status: "N/A", rationale: "No user-facing behavior or documentation is changed by this internal implementation." },
		reusable_learning: { status: "N/A", rationale: "No reusable or non-duplicative engineering lesson is introduced by this implementation." },
	}));
	const link = join(r, receiptPath);
	mkdirSync(dirname(link), { recursive: true });
	let made = false;
	try { symlinkSync(target, link); made = true; } catch {}
	if (made) check("symlink receipt → violation", checkDocumentationImpact(["src/main/a.js", receiptPath], r, loadConfig(r)).status === "violation");
	else console.log("⏭️  SKIP — receipt symlink 생성 권한 없음");
}

// checkStructure
check("src/x.js (F12 허용) → 위반0", checkStructure(["src/x.js"], root, cfg).length === 0);
check("experiments/x.js (미등록) → 위반1", checkStructure(["experiments/x.js"], root, cfg).length === 1);
check("random.txt (미등록 루트파일) → 위반1", checkStructure(["random.txt"], root, cfg).length === 1);

// isCharterFile — hook 자체 보호
check(".agents/hooks/x.js → charter(보호)", isCharterFile(".agents/hooks/x.js", root, cfg) === true);
check(".claude/settings.json → charter(보호)", isCharterFile(".claude/settings.json", root, cfg) === true);
check("AGENTS.md(charter_files) → charter", isCharterFile("AGENTS.md", root, cfg) === true);
check("src/main/x.js → charter 아님", isCharterFile("src/main/x.js", root, cfg) === false);

// normalizeRel — NFC + 절대경로
check("절대경로 → 루트 상대경로", normalizeRel(join(root, "src/a.js"), root) === "src/a.js");
check("트래버설 감지", normalizeRel("../x", root).startsWith(".."));

// symlink 우회 차단 (gemini 요구): 보호경로(.agents/hooks)를 가리키는 symlink로 우회 시도 → realpath로 차단
{
	const r = setupRoot();
	mkdirSync(join(r, ".agents/hooks"), { recursive: true });
	let made = false;
	try { symlinkSync(join(r, ".agents/hooks"), join(r, "safe"), "junction"); made = true; }
	catch { try { symlinkSync(join(r, ".agents/hooks"), join(r, "safe"), "dir"); made = true; } catch {} }
	if (made) {
		const c2 = loadConfig(r);
		check("symlink 'safe'→.agents/hooks: safe/x.js → charter 판정(realpath 차단)", isCharterFile("safe/x.js", r, c2) === true);
	} else {
		console.log("⏭️  SKIP — symlink 생성 권한 없음(Windows 개발자모드 필요). CI(Linux)에서 검증됨.");
	}
}
// reverse symlink 우회 차단 (codex 라운드6): 보호경로(.agents/hooks) 자체를 비보호 경로 symlink로 바꿔도 논리경로로 차단
{
	const r = setupRoot();
	mkdirSync(join(r, "src/hooks"), { recursive: true });
	let made = false;
	try { symlinkSync(join(r, "src/hooks"), join(r, ".agents/hooks"), "junction"); made = true; }
	catch { try { symlinkSync(join(r, "src/hooks"), join(r, ".agents/hooks"), "dir"); made = true; } catch {} }
	if (made) {
		const c3 = loadConfig(r);
		check("reverse symlink(.agents/hooks→src/hooks): .agents/hooks/x.js → charter(논리경로 차단)", isCharterFile(".agents/hooks/x.js", r, c3) === true);
	} else {
		console.log("⏭️  SKIP reverse symlink (권한). CI(Linux)에서 검증됨.");
	}
}

console.log(`\n결과: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
