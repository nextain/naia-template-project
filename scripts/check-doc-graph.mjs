#!/usr/bin/env node
/**
 * 문서 그래프 검증 — "문서는 고립되지 않아야 한다" + "상호링크는 상대경로".
 *
 * 탐지:
 *  (1) orphan — 아무 문서도 링크하지 않는 문서(진입점 제외). 고립 방지.
 *  (2) 절대경로 링크 — 문서 간 링크는 상대경로여야 함(절대/드라이브 경로 금지).
 *  (3) 깨진 링크 — 대상 파일이 없음.
 *
 * 사용: node scripts/check-doc-graph.mjs <docs-dir> [entry1] [entry2] ...
 *   entry = 고립 허용(진입점, 예: README.md). docs-dir 기준 상대경로.
 * 종료코드: 0 = 통과, 1 = 문제 발견.
 * ESM.
 */
import fs from "fs";
import path from "path";

const LINK_RE = /\[[^\]]*\]\(([^)]+)\)/g;

export function analyze(docsDir, entryPoints = []) {
	const mdFiles = [];
	(function walk(d) {
		for (const e of fs.readdirSync(d, { withFileTypes: true })) {
			const p = path.join(d, e.name);
			if (e.isDirectory()) walk(p);
			else if (/\.mdx?$/.test(e.name)) mdFiles.push(p);
		}
	})(docsDir);

	const incoming = new Map(mdFiles.map((f) => [path.resolve(f), 0]));
	const absLinks = [];
	const broken = [];

	for (const f of mdFiles) {
		const txt = fs.readFileSync(f, "utf8");
		let m;
		while ((m = LINK_RE.exec(txt)) !== null) {
			let link = m[1].split("#")[0].trim();
			if (!link || /^(https?:|mailto:|#)/.test(link)) continue;
			if (path.isAbsolute(link) || /^[a-zA-Z]:[\\/]/.test(link)) {
				absLinks.push({ file: path.relative(docsDir, f).replace(/\\/g, "/"), link });
				continue;
			}
			const target = path.resolve(path.dirname(f), link.replace(/\\/g, "/"));
			if (!fs.existsSync(target)) {
				broken.push({ file: path.relative(docsDir, f).replace(/\\/g, "/"), link });
				continue;
			}
			if (incoming.has(target)) incoming.set(target, incoming.get(target) + 1);
		}
	}

	const entrySet = new Set(entryPoints.map((e) => path.resolve(docsDir, e)));
	const orphans = [...incoming]
		.filter(([f, c]) => c === 0 && !entrySet.has(f))
		.map(([f]) => path.relative(docsDir, f).replace(/\\/g, "/"));

	return { orphans, absLinks, broken, total: mdFiles.length };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]).endsWith("check-doc-graph.mjs");
if (isMain) {
	const [, , docsDir, ...entries] = process.argv;
	if (!docsDir) {
		console.error("usage: node scripts/check-doc-graph.mjs <docs-dir> [entry...]");
		process.exit(1);
	}
	const r = analyze(docsDir, entries);
	let bad = false;
	if (r.absLinks.length) {
		bad = true;
		console.error("[문서그래프] 절대경로 링크(상대경로로 바꾸세요 — scripts/doc-link.mjs 사용):");
		for (const x of r.absLinks) console.error(`  - ${x.file} → ${x.link}`);
	}
	if (r.broken.length) {
		bad = true;
		console.error("[문서그래프] 깨진 링크(대상 없음):");
		for (const x of r.broken) console.error(`  - ${x.file} → ${x.link}`);
	}
	if (r.orphans.length) {
		bad = true;
		console.error("[문서그래프] 고립 문서(아무도 링크하지 않음 — 진입점이면 인자로 지정):");
		for (const o of r.orphans) console.error(`  - ${o}`);
	}
	if (bad) process.exit(1);
	console.log(`[문서그래프 통과] 문서 ${r.total}개 — 고립·절대경로·깨진 링크 없음`);
	process.exit(0);
}
