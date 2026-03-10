import fs from 'node:fs';
import path from 'node:path';
import { ensureAppScopedOpenCodeConfig } from './src/ipc/utils/app_scoped_opencode_config.ts';
import { app } from 'electron';

(app as any).getPath = (key: string) => {
  if (key === 'userData') return process.env.TMP_USERDATA!;
  if (key === 'home') return process.env.HOME!;
  return process.env.TMP_USERDATA!;
};

const defaultDir = path.join(process.env.HOME!, '.config', 'opencode');
fs.mkdirSync(defaultDir, { recursive: true });
fs.writeFileSync(path.join(defaultDir, 'opencode.json'), JSON.stringify({ plugin: ['oh-my-opencode', '@anyon-cli/anyon@latest'] }, null, 2));
fs.writeFileSync(path.join(defaultDir, 'anyon.jsonc'), '{"agents":{"Builder":{"model":"test"}}}\n');

const scoped = ensureAppScopedOpenCodeConfig();
console.log(JSON.stringify({
  defaultConfig: fs.readFileSync(path.join(defaultDir, 'opencode.json'), 'utf-8'),
  scopedConfig: fs.readFileSync(path.join(scoped, 'opencode.json'), 'utf-8'),
  scopedAnyon: fs.readFileSync(path.join(scoped, 'anyon.jsonc'), 'utf-8'),
  scopedDir: scoped,
}, null, 2));
