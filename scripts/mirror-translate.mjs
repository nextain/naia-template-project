#!/usr/bin/env node
/**
 * M13-mirror — `.agents/`(AI SoT) 수정 시 `.users/`(사람용 한국어 markdown)에 **비교 번역 동기화**.
 *
 * 구조: `.agents/<path>` → `.users/<path>.md`로 LLM 번역. 원본 해시를 미러에 박아 **변경 시에만** 번역(중복 호출 방지).
 *   LLM = gemini(Vertex). 트리거 = cron 또는 PostToolUse(async) hook.
 *   번역 지침에 "신조어·불친절한 약자 금지, 평이한 용어, 기술용어 (영문) 병기"를 넣어 M13-term과 정합.
 *
 * 사용:
 *   node scripts/mirror-translate.mjs <.agents 파일> --check   # 번역 필요 여부만 (exit 0=최신, 1=필요), LLM 호출 안 함
 *   node scripts/mirror-translate.mjs <.agents 파일>            # 실제 번역 후 .users 기록
 * ESM.
 */
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { execSync } from "child_process";

export function mapToUsers(agentsRel) {
	const rel = String(agentsRel).replace(/\\/g, "/");
	if (!rel.startsWith(".agents/")) return null;
	const sub = rel.slice(".agents/".length).replace(/\.(json|ya?ml|md|mdx)$/i, ".md");
	return ".users/" + sub;
}

function sha(s) {
	return crypto.createHash("sha256").update(s).digest("hex").slice(0, 16);
}

// 미러에 박힌 원본 해시와 비교해 번역 필요 여부 판정 (결정론)
export function translateNeeded(agentsFile, root) {
	const agentsRel = path.relative(root, path.resolve(root, agentsFile)).replace(/\\/g, "/");
	const usersRel = mapToUsers(agentsRel);
	if (!usersRel) return { needed: false, reason: "non-.agents" };
	let src;
	try {
		src = fs.readFileSync(path.join(root, agentsRel), "utf8");
	} catch {
		return { needed: false, reason: "no-source" };
	}
	const hash = sha(src);
	let dst;
	try {
		dst = fs.readFileSync(path.join(root, usersRel), "utf8");
	} catch {
		return { needed: true, usersRel, hash, reason: "no-mirror" };
	}
	const m = dst.match(/<!--\s*src-sha:\s*(\w+)\s*-->/);
	if (m && m[1] === hash) return { needed: false, usersRel, hash, reason: "up-to-date" };
	return { needed: true, usersRel, hash, reason: "stale" };
}

async function translateViaGemini(content) {
	const project = execSync("gcloud config get-value project", { encoding: "utf8" }).trim();
	const token = execSync("gcloud auth print-access-token", { encoding: "utf8" }).trim();
	const prompt =
		"다음 AI 컨텍스트 파일을 사람이 읽기 쉬운 한국어 마크다운으로 번역·정리하라. " +
		"신조어·불친절한 약자 금지, 평이한 용어, 기술용어는 (영문) 병기, 원문 의미 보존.\n\n---\n" +
		content;
	const url = `https://aiplatform.googleapis.com/v1/projects/${project}/locations/global/publishers/google/models/gemini-3.5-flash:generateContent`;
	const res = await fetch(url, {
		method: "POST",
		headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
		body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 16000 } }),
	});
	const j = await res.json();
	if (j.error) throw new Error(j.error.message);
	return (j.candidates?.[0]?.content?.parts || []).map((p) => p.text).filter(Boolean).join("");
}

const isMain = process.argv[1] && path.resolve(process.argv[1]).endsWith("mirror-translate.mjs");
if (isMain) {
	const [, , file, flag] = process.argv;
	const root = process.env.MIRROR_PROJECT_ROOT || process.cwd();
	if (!file) {
		console.error("usage: node scripts/mirror-translate.mjs <.agents 파일> [--check]");
		process.exit(2);
	}
	const r = translateNeeded(file, root);
	if (flag === "--check") {
		console.log(`[mirror] ${r.reason}` + (r.usersRel ? ` → ${r.usersRel}` : ""));
		process.exit(r.needed ? 1 : 0);
	}
	if (!r.needed) {
		console.log(`[mirror] 최신(${r.reason}) — 번역 생략`);
		process.exit(0);
	}
	const src = fs.readFileSync(path.join(root, file), "utf8");
	const translated = await translateViaGemini(src);
	const out = `<!-- src-sha: ${r.hash} -->\n<!-- 자동 번역 미러 (M13-mirror). 원본: ${path.relative(root, path.resolve(root, file)).replace(/\\/g, "/")} -->\n\n${translated}\n`;
	const dst = path.join(root, r.usersRel);
	fs.mkdirSync(path.dirname(dst), { recursive: true });
	fs.writeFileSync(dst, out);
	console.log(`[mirror] 번역 완료 → ${r.usersRel} (src-sha ${r.hash})`);
	process.exit(0);
}
