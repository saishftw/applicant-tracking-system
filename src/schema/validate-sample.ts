import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { JobRoleSchema } from "./jd";

// Sanity check: the existing extracted JD must parse against our mirror of JobRoleSchema.
const here = dirname(fileURLToPath(import.meta.url));
const jsonPath = resolve(here, "../../hr_assistant_prime_ac.json");
const raw: unknown = JSON.parse(readFileSync(jsonPath, "utf-8"));

const result = JobRoleSchema.safeParse(raw);
if (result.success) {
  console.log("✓ hr_assistant_prime_ac.json validates against JobRoleSchema");
  console.log(`  role: ${result.data.role} · skills: ${result.data.skills.length} · responsibilities: ${result.data.responsibilities.length}`);
} else {
  console.error("✗ Validation failed:");
  console.error(JSON.stringify(result.error.format(), null, 2));
  process.exit(1);
}
