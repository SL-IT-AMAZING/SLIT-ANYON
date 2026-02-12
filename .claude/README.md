# Claude Code Configuration

This directory contains Claude Code configuration for the Anyon project.

## Commands

Slash commands are invoked with `/anyon:<command>`. Available commands:

| Command                 | Description                                                    | Uses                                |
| ----------------------- | -------------------------------------------------------------- | ----------------------------------- |
| `/anyon:plan-to-issue`   | Convert a plan to a GitHub issue                               | -                                   |
| `/anyon:fix-issue`       | Fix a GitHub issue                                             | `pr-push`                           |
| `/anyon:pr-fix`          | Fix PR issues from CI failures or review comments              | `pr-fix:comments`, `pr-fix:actions` |
| `/anyon:pr-fix:comments` | Address unresolved PR review comments                          | `lint`, `pr-push`                   |
| `/anyon:pr-fix:actions`  | Fix failing CI checks and GitHub Actions                       | `e2e-rebase`, `pr-push`             |
| `/anyon:pr-rebase`       | Rebase the current branch                                      | `pr-push`                           |
| `/anyon:pr-push`         | Push changes and create/update a PR                            | `remember-learnings`                |
| `/anyon:lint`            | Run all pre-commit checks (formatting, linting, type-checking) | -                                   |
| `/anyon:e2e-rebase`      | Rebase E2E test snapshots                                      | -                                   |
| `/anyon:deflake-e2e`     | Deflake flaky E2E tests                                        | -                                   |
| `/anyon:session-debug`   | Debug session issues                                           | -                                   |
