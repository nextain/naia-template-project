import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// 14 locales per naia.land SUPPORTED_LOCALES (brief tpl-readme-14lang-20261124).
// en uses the bare README.md; all others use a suffixed file.
const LOCALES = [
  { code: 'en', label: 'English', file: 'README.md' },
  { code: 'ko', label: '한국어', file: 'README.ko.md' },
  { code: 'ja', label: '日本語', file: 'README.ja.md' },
  { code: 'zh', label: '简体中文', file: 'README.zh-CN.md' },
  { code: 'fr', label: 'Français', file: 'README.fr.md' },
  { code: 'de', label: 'Deutsch', file: 'README.de.md' },
  { code: 'ru', label: 'Русский', file: 'README.ru.md' },
  { code: 'es', label: 'Español', file: 'README.es.md' },
  { code: 'ar', label: 'العربية', file: 'README.ar.md' },
  { code: 'hi', label: 'हिन्दी', file: 'README.hi.md' },
  { code: 'bn', label: 'বাংলা', file: 'README.bn.md' },
  { code: 'pt', label: 'Português', file: 'README.pt.md' },
  { code: 'id', label: 'Bahasa Indonesia', file: 'README.id.md' },
  { code: 'vi', label: 'Tiếng Việt', file: 'README.vi.md' },
];

const REQUIRED_URLS = [
  'https://github.com/nextain/naia-shell',
  'https://github.com/nextain/naia-agent',
  'https://github.com/nextain/naia-memory',
  'https://github.com/nextain/naia-kb-compiler',
  'https://github.com/nextain/naia-adk',
  'https://nextain.io',
  'https://naia.nextain.io',
];

const LEGACY_FREE_DOCS = ['packages/openclaw-compat/README.md'];

test('all 14 locale READMEs exist (naia.land SUPPORTED_LOCALES)', () => {
  const missing = LOCALES.filter(({ file }) => !existsSync(join(root, file))).map(
    ({ file }) => file,
  );
  assert.deepEqual(missing, [], `missing locale READMEs: ${missing.join(', ')}`);
});

for (const { code, label, file } of LOCALES) {
  test(`${file} (${code}) has no legacy naia-os links`, () => {
    const body = readFileSync(join(root, file), 'utf8');
    assert.ok(
      !body.includes('github.com/nextain/naia-os'),
      `${file} still links to the legacy naia-os repository`,
    );
  });

  test(`${file} (${code}) links the 4 sibling repos, naia-adk, and Nextain sites`, () => {
    const body = readFileSync(join(root, file), 'utf8');
    for (const url of REQUIRED_URLS) {
      assert.ok(body.includes(url), `${file} is missing ${url}`);
    }
  });

  test(`${file} (${code}) language bar links all 14 locales (self bold, 13 peers linked)`, () => {
    const body = readFileSync(join(root, file), 'utf8');
    const bar = body.split('\n')[0];
    assert.ok(
      bar.includes(`**${label}**`),
      `${file} language bar must bold its own label (**${label}**)`,
    );
    assert.ok(
      !bar.includes(`](${file})`),
      `${file} language bar must not link to itself`,
    );
    for (const peer of LOCALES) {
      if (peer.file === file) continue;
      assert.ok(
        bar.includes(`[${peer.label}](${peer.file})`),
        `${file} language bar is missing [${peer.label}](${peer.file})`,
      );
    }
    const peerLinks = bar.match(/\]\((README[^)]+)\)/g) || [];
    assert.equal(
      peerLinks.length,
      13,
      `${file} language bar must carry exactly 13 peer links, found ${peerLinks.length}`,
    );
  });
}

test('README.template.md stays a template (placeholders intact)', () => {
  const body = readFileSync(join(root, 'README.template.md'), 'utf8');
  assert.ok(
    body.includes('{{PROJECT_NAME}}'),
    'README.template.md must keep its {{PROJECT_NAME}} placeholder',
  );
});

for (const file of ['README.md', 'README.ko.md', 'README.template.md']) {
  test(`${file} still has no legacy naia-os links (pre-existing coverage)`, () => {
    const body = readFileSync(join(root, file), 'utf8');
    assert.ok(
      !body.includes('github.com/nextain/naia-os'),
      `${file} still links to the legacy naia-os repository`,
    );
  });

  test(`${file} still links the 4 sibling repos, naia-adk, and Nextain sites (pre-existing coverage)`, () => {
    const body = readFileSync(join(root, file), 'utf8');
    for (const url of REQUIRED_URLS) {
      assert.ok(body.includes(url), `${file} is missing ${url}`);
    }
  });
}

for (const file of LEGACY_FREE_DOCS) {
  test(`${file} has no legacy naia-os links`, () => {
    const body = readFileSync(join(root, file), 'utf8');
    assert.ok(
      !body.includes('github.com/nextain/naia-os'),
      `${file} still links to the legacy naia-os repository`,
    );
  });
}
