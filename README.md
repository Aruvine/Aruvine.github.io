# aruvine.github.io

Two things live here.

## Wind Bot's legal pages, at the root

- https://aruvine.github.io/ · https://aruvine.github.io/privacy.html · https://aruvine.github.io/terms.html

Discord requires a bot's privacy policy and terms to be reachable, and a static
site keeps them up whether or not the bot is running. Wind Bot's own code is in
a private repository; nothing about it is here but these three pages.

## Vaultline, at /vaultline/

- Play: https://aruvine.github.io/vaultline/
- Level designer: https://aruvine.github.io/vaultline/editor/

A first-person parkour time trial that runs in the browser. Built with three.js
(MIT). The source of the build lives in a private repo.

It used to sit at the root and moved down one level to make room for the legal
pages. **Whatever deploys the build has to write to `vaultline/index.html` now,
not to `index.html`**, or the next deploy puts the game back over the legal
page.

## The leaderboard stays at /board/

`board/` did **not** move, and must not: the build has
`BOARD_ORIGIN = 'https://aruvine.github.io'` and `BOARD_PATH = 'board/'` baked
in as an absolute URL, so the live game reads the board from the root whatever
folder the game itself is in.

A run is posted from the finish screen as an issue on this repository. The
Leaderboard action checks it against the real level geometry, keeps each
player's best, and commits the result under `board/`. None of that changed.
