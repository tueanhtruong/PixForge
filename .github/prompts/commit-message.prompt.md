---
description: "Generate a Conventional Commits message from staged changes. USE WHEN: user asks for commit message, generate commit, write commit."
mode: "agent"
tools: ["changes"]
---

# Generate Commit Message

Review the current staged changes (git diff --staged) and generate a commit message following Conventional Commits v1.0.0.

## Steps

1. Use `get_changed_files` to inspect staged changes
2. Determine the most appropriate **type** (`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`)
3. Identify a **scope** from the changed files (e.g., `image`, `svg`, `ui`, `ci`) — omit if changes span too many areas
4. Write a concise imperative **subject** (lowercase, no period, max 72 chars)
5. If the change is non-trivial, add a **body** explaining _what_ and _why_
6. If there are breaking changes, add `BREAKING CHANGE:` footer

## Output

Return ONLY the commit message text, ready to copy-paste. No explanations or markdown fences.
