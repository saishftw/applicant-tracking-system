import { SkillChip, GapChip } from "./chips";
import { cn } from "@/lib/utils";
import type { CandidateFacets } from "@/data/seed";

/** Top matching skills + the single identified gap — the Gate 1 facets shown
 *  on the shortlist, swipe card, and profile (mirrors the reference screen). */
export function MatchFacets({ facets, className }: { facets: CandidateFacets; className?: string }) {
  return (
    <div className={cn("grid gap-5 sm:grid-cols-2", className)}>
      <div className="min-w-0">
        <p className="section-label mb-2">Top matching skills</p>
        <div className="flex flex-wrap gap-1.5">
          {facets.matchingSkills.map((s) => (
            <SkillChip key={s}>{s}</SkillChip>
          ))}
        </div>
      </div>
      <div className="min-w-0 sm:border-l sm:border-slate-200 sm:pl-5">
        <p className="section-label mb-2">Identified gap</p>
        <GapChip>{facets.gap}</GapChip>
      </div>
    </div>
  );
}
