#!/bin/bash
# Claude Code status line for the kelly-is-better project.
# Shows: model name, context window usage, and reasoning effort level
# (when the current model/session exposes one).
#
# Checked into the repo at .claude/statusline.sh and wired up via
# .claude/settings.json so it applies to anyone working in this repo.

input=$(cat)

model=$(echo "$input" | jq -r '.model.display_name // .model.id // "unknown-model"')

used_pct=$(echo "$input" | jq -r '.context_window.used_percentage // empty')
if [ -n "$used_pct" ]; then
  context_str="Context: $(printf '%.0f' "$used_pct")%"
else
  context_str="Context: n/a"
fi

effort=$(echo "$input" | jq -r '.effort.level // empty')

output="$model | $context_str"
if [ -n "$effort" ]; then
  output="$output | Effort: $effort"
fi

printf '%s' "$output"
