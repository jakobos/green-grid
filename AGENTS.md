 Daily loop

 ```sh
guild change new "what becomes true" --lane active        # or effort new → effort set --status active → change new --effort E01 --slice N
git add spec && git commit -m "Plan C001"                 # briefs read spec/ at HEAD, so commit first
guild context C001                                        # preview the worker's brief
guild spawn --change C001 "task" --provider anthropic --model … --thinking medium [--prepare "npm ci"] [--tab]
guild status / guild diff <job> / guild steer <job> "…"
guild spawn --review --branch guild/<job> "…" --provider … --model … --thinking high   # optional second opinion
guild continue <job> "fix: …"                             # optional repair, same session and branch
guild land <job>                                          # merge, close C001, commit the bookkeeping
$EDITOR spec/changes/done/*/C001-*/outcome.md && git commit -am "C001 outcome"
guild prune --retire
 ```
