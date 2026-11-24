import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const READMES = ['README.md', 'README.ko.md', 'README.template.md'];
const REQUIRED_URLS = [
  'https://github.com/nextain/naia-shell',
  'https://github.com/nextain/naia-agent',
  'https://github.com/nextain/naia-memory',
  'https://github.com/nextain/naia-kb-compiler',
  'https://github.com/nextain/naia-adk',
  'https://nextain.io',
  'https://naia.nextain.io',
];

for (const file of READMES) {
  test(`${file} has no legacy naia-os links`, () => {
    const body = readFileSync(join(root, file), 'utf8');
    assert.ok(
      !body.includes('github.com/nextain/naia-os'),
      `${file} still links to the legacy naia-os repository`,
    );
  });

  test(`${file} links the 4 sibling repos, naia-adk, and Nextain sites`, () => {
    const body = readFileSync(join(root, file), 'utf8');
    for (const url of REQUIRED_URLS) {
      assert.ok(body.includes(url), `${file} is missing ${url}`);
    }
  });
}
