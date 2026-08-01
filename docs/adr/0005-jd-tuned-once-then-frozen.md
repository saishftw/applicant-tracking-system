# The JD is tuned once at upload, then frozen

After the raw text JD is pasted and the LLM extracts the Structured JD, the recruiter adjusts it **once** — correcting skills the extraction missed and setting importance levels (`essential` / `important` / `valuable`) — and the JD is then **frozen** for the run. There is no later editing, no JD versioning, and no re-scoring: candidates are scored once against the finalized JD.

This deliberately drops the more powerful "edit the JD anytime and re-rank" capability, which would add versioning, asynchronous re-scoring, and cross-gate propagation complexity that the demo's story does not need. Post-upload JD editing and its propagation across gates is captured as backlog (see BACKLOG.md).
