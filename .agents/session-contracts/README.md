# Session Contracts

Runtime contracts and `.session-map.json` are local and ignored. A session may
mutate only when the registry pointer, active contract digest, explicit
`session_bindings` entry, and progress contract reference all agree. Progress
and legacy `process-status.current_work` are read-only evidence, not authority.
`target_ownership` accepts exact repository-relative paths or directory-prefix
patterns ending in `/**`; overlapping active ownership is ambiguous and blocks
mutation.
Non-read-only shell execution requires an exact `allowed_shell_commands` entry
covered by the contract digest.
This is whole-command authority rather than a process sandbox; review must
verify the command's actual side effects against ownership.
