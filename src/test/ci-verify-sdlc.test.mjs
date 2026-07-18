#!/usr/bin/env node
/** M2 CI 재검증 — CLI exit code + fail-closed 검증. */
import { spawnSync } from "child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPT = resolve(__dirname, "../../scripts/ci-verify-sdlc.mjs");
const LONG = "내용 ".repeat(40);

function setupRoot(files = {}) {
	const d = mkdtempSync(join(tmpdir(), "cisdlc-"));
	const rules = { self_trust_config: {
		enforcement_level: "enforced",
		change_set_rules: [{ id: "src", when_changed_glob: ["src/main/**"], requires: ["docs/user-scenarios.md", "docs/requirements.md"], exempt_glob: ["**/*.test.*", "docs/**"] }],
		documentation_impact_gate: { enabled: true, when_changed_glob: ["src/main/**"], exempt_glob: ["**/*.test.*"], receipt_glob: "docs/progress/99.dev-comm/issue-*-documentation-impact.json", required_targets: ["repository_docs", "user_manual", "reusable_learning"], target_evidence_glob: { repository_docs: ["README.md", "docs/**"], user_manual: ["docs/manual/**"], reusable_learning: ["AGENTS.md", "docs/lessons/**"] }, na_rationale_min_chars: 30 },
		artifact_min_meaningful_chars: 100,
	} };
	const rp = join(d, ".agents/context/agents-rules.json");
	mkdirSync(dirname(rp), { recursive: true });
	writeFileSync(rp, JSON.stringify(rules));
	for (const [p, c] of Object.entries(files)) { const fp = join(d, p); mkdirSync(dirname(fp), { recursive: true }); writeFileSync(fp, c); }
	return d;
}
function run(root, ...files) {
	return spawnSync("node", [SCRIPT, ...files], { encoding: "utf8", env: { ...process.env, CI_PROJECT_ROOT: root } }).status;
}

const full = setupRoot({ "docs/user-scenarios.md": "## UC\n" + LONG, "docs/requirements.md": "## FR\n" + LONG });
const receiptPath = "docs/progress/99.dev-comm/issue-42-documentation-impact.json";
const receipt = JSON.stringify({ issue: 42, production_files: ["src/main/a.js"], targets: {
	repository_docs: { status: "UPDATED", evidence: ["docs/requirements.md"] },
	user_manual: { status: "N/A", rationale: "No user-visible setup, operation, or limitation changed in this internal update." },
	reusable_learning: { status: "N/A", rationale: "No reusable engineering principle was introduced beyond the existing documented pattern." },
} });
mkdirSync(dirname(join(full, receiptPath)), { recursive: true });
writeFileSync(join(full, receiptPath), receipt);
let pass = 0, fail = 0;
const check = (n, c) => { console.log(`${c ? "✅ PASS" : "❌ FAIL"} — ${n}`); c ? pass++ : fail++; };

check("src/main + UC·REQ + receipt → exit 0", run(full, "src/main/a.js", "docs/requirements.md", receiptPath) === 0);
check("src/main + receipt 없음 → exit 1", run(setupRoot({}), "src/main/a.js") === 1);
check("src/main + UC만(부분) → exit 1", run(setupRoot({ "docs/user-scenarios.md": "## UC\n" + LONG }), "src/main/a.js") === 1);
check("docs만 변경 → exit 0(n/a)", run(setupRoot({}), "docs/x.md") === 0);
check("fail-closed: 설정 부재 → exit 1", run(mkdtempSync(join(tmpdir(), "cisdlc-noreg-")), "src/main/a.js") === 1);

console.log(`\n결과: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
