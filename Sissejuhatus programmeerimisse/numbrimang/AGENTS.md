# AGENTS.md

## Project

Guess the Number is a TypeScript terminal game that runs with Bun. The computer picks a secret number from 1 to 10. After each incorrect guess, the game prints `Higher` or `Lower`. The score is the negative number of wrong guesses. A first-guess win scores 0.

- `index.ts` contains the whole game, including terminal styling, leaderboard storage, input, and the game loop.
- `package.json` defines the ES module and the `start` script.
- `leaderboard.json` stores `{ name, bestScore, gamesPlayed, lastPlayed }` rows and begins with sample data. Playing can update it.
- `README.md` explains how to run and play the game.

## Commands and code conventions

- Run from this directory with `bun start` or `bun run index.ts`.
- Verify changes by playing a few rounds, including invalid guesses, quitting, and piping multiple lines into stdin.
- Use double quotes, two-space indentation, trailing commas in multiline literals, and section comments in the existing style.
- Keep the game in one TypeScript file without package dependencies. Prefer Bun and Node built-ins. Keep the terminal messages in English.
- Send styled text through `style`. Disable styling when stdout is not a TTY or `NO_COLOR` is set.

## Behavior to preserve

- Higher scores rank first. Ties sort by name.
- Match player names case-insensitively for greetings and score updates.
- Record games with at least one valid guess, including games ended early.
- Show the first 10 ranks and, if needed, the current player's row below a separator.
- Buffer input so that pasted and piped lines survive between prompts.
- Start with an empty leaderboard when the file is missing or unreadable.
- Keep `MIN`, `MAX`, `TOP_N`, and `WIDTH` as the tuning constants.

## GitHub workflow

- Before changing this game, create a GitHub issue explaining the change and why it is needed. Include a checklist of verifiable acceptance criteria. For features and other work, title it `As a <role>, I want <feature>, so that <benefit>`.
- For bugs, use the `bug` label and a short title that describes the problem. Include steps to reproduce, expected and actual behavior, and the environment with the Bun version and operating system. State acceptance criteria as observable fixes.
- Reference the issue number in the commit message or pull request. Use `Closes #<issue>` in the pull request description when the change resolves the issue.
- After confirming that the squash commit is on the remote default branch, automatically close the linked issue if it is still open. Include the squash commit in the closing comment.
- Automatically delete the merged feature branch locally and on the remote wherever it exists. Before deletion, verify that the branch contains only the work included in the merge and that no worktree has it checked out. The maintainer has authorized the issue closure and branch cleanup in advance.
- Let the game update `leaderboard.json` during play. Edit it by hand only when requested. After testing, review the diff for accidental sample data changes.
