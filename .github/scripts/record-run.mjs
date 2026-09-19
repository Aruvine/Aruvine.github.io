// Leaderboard intake: check one posted run and fold it into the static board the site serves.
//
// Input comes only from the Action's environment (never interpolated into a shell):
//   ISSUE_BODY    the issue-form body (### Level / ### Time / ### Ghost)
//   ISSUE_NUMBER  the issue number
//   ISSUE_USER    the GitHub login that opened the issue — this, not anything in the body, is who the run belongs to
// Output: board/<levelId>.json, board/ghosts/<levelId>/<user>.txt, board/index.json, and a result file at
// $RUNNER_TEMP/run-result.json that reply.mjs turns into a comment.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const ROOT = process.cwd();
const BOARD = path.join(ROOT, 'board');
const VALIDATOR = path.join(ROOT, '.github', 'scripts', 'validate-run.mjs');
const RESULT = path.join(process.env.RUNNER_TEMP || os.tmpdir(), 'run-result.json');
const MAX_ENTRIES = 100;

const LOGIN_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
const LEVEL_RE = /^[A-Za-z0-9_-]{1,64}$/;

function done(result) {
  fs.writeFileSync(RESULT, JSON.stringify(result));
  console.log(JSON.stringify(result));
  process.exit(0);
}

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 1) + '\n');
}

function clock(t) {
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  return `${String(m).padStart(2, '0')}:${s.toFixed(2).padStart(5, '0')}`;
}

const user = process.env.ISSUE_USER || '';
const issue = Number(process.env.ISSUE_NUMBER);
const body = process.env.ISSUE_BODY || '';

if (!LOGIN_RE.test(user)) done({ status: 'rejected', message: 'That GitHub account name could not be read.' });
if (!Number.isInteger(issue) || issue <= 0) done({ status: 'rejected', message: 'Missing issue number.' });

if (!fs.existsSync(VALIDATOR)) {
  done({ status: 'pending', message: 'The run checker is not installed on the site yet. Your run is saved here — it will be checked as soon as the checker goes live.' });
}

// Hand the body to the validator through a file so nothing in it ever reaches a shell.
const bodyFile = path.join(os.tmpdir(), `run-${issue}.md`);
fs.writeFileSync(bodyFile, body);
let verdict;
try {
  const out = execFileSync(process.execPath, [VALIDATOR, bodyFile], { encoding: 'utf8', timeout: 60_000, maxBuffer: 16 * 1024 * 1024 });
  const line = out.trim().split('\n').filter(Boolean).pop();
  verdict = JSON.parse(line);
} catch (err) {
  done({ status: 'rejected', message: 'The run could not be checked: ' + (err && err.message ? err.message.split('\n')[0] : 'checker failed') });
}

if (!verdict || !verdict.ok) {
  done({ status: 'rejected', message: (verdict && verdict.reason) || 'The run did not pass the check.' });
}

const levelId = String(verdict.levelId || '');
const levelName = String(verdict.levelName || levelId);
const time = Number(verdict.time);
const splits = Array.isArray(verdict.splits) ? verdict.splits.map(Number) : [];
const ghost = String(verdict.ghost || '');

if (!LEVEL_RE.test(levelId)) done({ status: 'rejected', message: 'Unknown level.' });
if (!(time > 0) || !Number.isFinite(time)) done({ status: 'rejected', message: 'The run has no valid time.' });
if (!ghost) done({ status: 'rejected', message: 'The run has no ghost.' });

const boardFile = path.join(BOARD, `${levelId}.json`);
const board = readJson(boardFile, { level: levelId, name: levelName, updated: null, entries: [] });
board.level = levelId;
board.name = levelName;
if (!Array.isArray(board.entries)) board.entries = [];

const existing = board.entries.find((e) => e.user === user);
if (existing && existing.time <= time) {
  done({
    status: 'kept',
    levelName,
    time,
    best: existing.time,
    message: `Checked and valid, but your board time on ${levelName} is already ${clock(existing.time)}, which is faster than this ${clock(time)}. Your board entry stays as it is.`,
  });
}

const at = new Date().toISOString();
const entry = { user, time: Math.round(time * 1000) / 1000, splits: splits.map((s) => Math.round(s * 1000) / 1000), issue, at };
board.entries = board.entries.filter((e) => e.user !== user);
board.entries.push(entry);
board.entries.sort((a, b) => a.time - b.time || String(a.at).localeCompare(String(b.at)));

// Anyone pushed off the end loses their ghost file too, so the folder never grows past the board.
const dropped = board.entries.slice(MAX_ENTRIES);
board.entries = board.entries.slice(0, MAX_ENTRIES);
board.updated = at;
writeJson(boardFile, board);

const ghostDir = path.join(BOARD, 'ghosts', levelId);
fs.mkdirSync(ghostDir, { recursive: true });
fs.writeFileSync(path.join(ghostDir, `${user}.txt`), ghost);
for (const e of dropped) {
  if (LOGIN_RE.test(e.user)) fs.rmSync(path.join(ghostDir, `${e.user}.txt`), { force: true });
}

const rank = board.entries.findIndex((e) => e.user === user) + 1;

// A small index so a page can show every level's leader without fetching every board.
const indexFile = path.join(BOARD, 'index.json');
const index = readJson(indexFile, { updated: null, levels: {} });
index.levels = index.levels || {};
index.levels[levelId] = {
  name: levelName,
  runs: board.entries.length,
  leader: board.entries[0] ? { user: board.entries[0].user, time: board.entries[0].time } : null,
};
index.updated = at;
writeJson(indexFile, index);

done({
  status: 'accepted',
  levelName,
  levelId,
  time: entry.time,
  previous: existing ? existing.time : null,
  rank,
  of: board.entries.length,
  message: rank === 1
    ? `New record on ${levelName}: ${clock(entry.time)}. You're #1.`
    : `On the board for ${levelName}: ${clock(entry.time)}, #${rank} of ${board.entries.length}.`,
});
