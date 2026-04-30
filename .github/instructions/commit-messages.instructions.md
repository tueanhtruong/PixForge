---
applyTo: "**"
description: "Conventional Commits standard for commit messages. USE WHEN: generating commit messages, suggesting commit messages, writing git commits, reviewing commit message format."
---

# Commit Message Format — Conventional Commits v1.0.0

## Structure

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Types

| Type       | When to use                                             |
| ---------- | ------------------------------------------------------- |
| `feat`     | A new feature                                           |
| `fix`      | A bug fix                                               |
| `docs`     | Documentation only changes                              |
| `style`    | Formatting, missing semi colons, etc (no logic)         |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf`     | A code change that improves performance                 |
| `test`     | Adding or correcting tests                              |
| `build`    | Changes to build system or external dependencies        |
| `ci`       | Changes to CI configuration files and scripts           |
| `chore`    | Other changes that don't modify src or test             |
| `revert`   | Reverts a previous commit                               |

## Rules

1. **Subject line** must be imperative, lowercase, no period at end, max 72 chars
2. **Scope** is optional, in parentheses: `feat(image): add quality slider`
3. **Body** (optional) separated by a blank line, explains _what_ and _why_ (not _how_)
4. **Breaking changes** must include `BREAKING CHANGE:` in footer or `!` after type/scope: `feat!: remove legacy API`
5. Keep commits atomic — one logical change per commit

## Examples

```
feat(svg): add aggressive optimization preset
```

```
fix(image): prevent memory leak on Object URL cleanup

Revoke blob URLs on component unmount to free memory on iOS Safari.
```

```
ci: migrate GitHub Actions workflow from npm to pnpm
```

```
feat!: drop support for Node 16

BREAKING CHANGE: minimum Node version is now 18.
```
