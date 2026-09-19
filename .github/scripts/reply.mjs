// Turn record-run.mjs's result into a reply on the issue, a label, and (unless still pending) closing it.
// Uses the gh CLI that ships on GitHub's runners, authenticated by GH_TOKEN; arguments go through execFile,
// never a shell, so nothing from the issue can be interpreted as a command.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const RESULT = path.join(process.env.RUNNER_TEMP || os.tmpdir(), 'run-result.json');
const issue = String(Number(process.env.ISSUE_NUMBER));
const pushed = process.env.BOARD_PUSHED === 'true';

let result;
try { result = JSON.parse(fs.readFileSync(RESULT, 'utf8')); } catch { result = { status: 'rejected', message: 'The check did not produce a result.' }; }

const gh = (...args) => execFileSync('gh', args, { stdio: 'inherit' });

let label;
let text;
if (result.status === 'accepted') {
  label = 'accepted';
  text = pushed
    ? `${result.message}\n\nThe board updates on the site in a minute or so: https://aruvine.github.io/`
    : `${result.message}\n\nThe run is valid, but saving the board failed on this attempt. Edit this issue (any small change) to retry.`;
} else if (result.status === 'kept') {
  label = 'accepted';
  text = result.message;
} else if (result.status === 'pending') {
  label = null;
  text = result.message;
} else {
  label = 'rejected';
  text = `This run was not added to the board: ${result.message}\n\nIf you think that's wrong, finish the run again in the game and post it from the finish screen.`;
}

gh('issue', 'comment', issue, '--body', text);
if (label) gh('issue', 'edit', issue, '--add-label', label);
if (result.status !== 'pending' && !(result.status === 'accepted' && !pushed)) {
  gh('issue', 'close', issue, '--reason', result.status === 'rejected' ? 'not planned' : 'completed');
}
