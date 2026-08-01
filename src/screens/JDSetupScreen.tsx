import { useState } from "react";
import { Lock, Plus, Sparkles, Trash2, X } from "lucide-react";
import {
  CompanySize,
  CompanyStage,
  EmploymentType,
  EnvironmentType,
  ImportanceLevel,
  LanguageLevel,
  ProficiencyLevel,
  RemoteOption,
  SeniorityLevel,
  UrgencyLevel,
  type JobRole,
} from "@/schema";
import { useAppStore } from "@/store/useAppStore";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function JDSetupScreen() {
  const activePositionId = useAppStore((s) => s.activePositionId);
  const positions = useAppStore((s) => s.positions);
  const updateJd = useAppStore((s) => s.updateJd);
  const addSkill = useAppStore((s) => s.addSkill);
  const freeze = useAppStore((s) => s.freezeJD);
  const goTo = useAppStore((s) => s.goTo);

  const pos = positions.find((p) => p.id === activePositionId);
  if (!pos) return null;

  const job = pos.jd.jobRole;
  const frozen = pos.jd.frozen;
  const editable = !frozen;
  const edit = (fn: (jr: JobRole) => void) => updateJd(fn);

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-5xl">
          <ScreenHeader
            eyebrow={pos.department}
            title={job.role}
            subtitle={
              frozen
                ? "This role is frozen. Candidates were scored once against the criteria below."
                : "The AI extracted this structured job description. Review it, delete anything wrong, adjust the dropdowns, then freeze & score."
            }
            actions={
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700">
                {frozen ? <Lock className="size-3.5" /> : <Sparkles className="size-3.5" />}
                {frozen ? "Frozen" : "AI-extracted"}
              </span>
            }
          />

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {/* Overview */}
            <Section title="Overview" className="lg:col-span-2">
              <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                <Field label="Role" value={job.role} />
                <Field label="Company" value={job.company.name} />
                <EnumRow
                  label="Company size"
                  value={job.company.size ?? ""}
                  options={CompanySize.options}
                  editable={editable}
                  onChange={(v) => edit((jr) => { jr.company.size = v ? (v as CompanySize) : null; })}
                  onDelete={editable && job.company.size ? () => edit((jr) => (jr.company.size = null)) : undefined}
                />
                <EnumRow
                  label="Company stage"
                  value={job.company.stage ?? ""}
                  options={CompanyStage.options}
                  editable={editable}
                  onChange={(v) => edit((jr) => { jr.company.stage = v ? (v as CompanyStage) : null; })}
                  onDelete={editable && job.company.stage ? () => edit((jr) => (jr.company.stage = null)) : undefined}
                />
              </div>
              {job.industry && job.industry.length > 0 && (
                <StringChips
                  label="Industry"
                  items={job.industry}
                  editable={editable}
                  onDelete={(i) => edit((jr) => jr.industry?.splice(i, 1))}
                  onAdd={(v) => edit((jr) => { jr.industry = [...(jr.industry ?? []), v]; })}
                  addPlaceholder="Add industry…"
                />
              )}
            </Section>

            {/* Objectives */}
            {job.role_objectives && job.role_objectives.length > 0 && (
              <Section
                title="Role objectives"
                className="lg:col-span-2"
                onRemove={editable ? () => edit((jr) => (jr.role_objectives = null)) : undefined}
              >
                <BulletList
                  items={job.role_objectives}
                  editable={editable}
                  onDelete={(i) => edit((jr) => jr.role_objectives?.splice(i, 1))}
                />
              </Section>
            )}

            {/* Responsibilities */}
            <Section title="Responsibilities" className="lg:col-span-2">
              <BulletList
                items={job.responsibilities}
                editable={editable}
                onDelete={(i) => edit((jr) => jr.responsibilities.splice(i, 1))}
                onAdd={editable ? (v) => edit((jr) => jr.responsibilities.push(v)) : undefined}
                addPlaceholder="Add a responsibility…"
              />
            </Section>

            {/* Skills */}
            <Section title="Skills" subtitle="Priority drives how heavily each skill counts at pre-screen." className="lg:col-span-2">
              <div className="space-y-1.5">
                {job.skills.map((s, i) => (
                  <ObjectRow key={i} onDelete={editable ? () => edit((jr) => jr.skills.splice(i, 1)) : undefined}>
                    <span className="flex-1 text-sm font-medium text-slate-800">{s.skill}</span>
                    <EnumSelect
                      value={s.priority}
                      options={ImportanceLevel.options}
                      disabled={!editable}
                      onChange={(v) => edit((jr) => { const t = jr.skills[i]; if (t) t.priority = v as ImportanceLevel; })}
                    />
                    <EnumSelect
                      value={s.proficiency_level ?? ""}
                      options={ProficiencyLevel.options}
                      allowEmpty
                      emptyLabel="Not specified"
                      disabled={!editable}
                      onChange={(v) => edit((jr) => { const t = jr.skills[i]; if (t) t.proficiency_level = (v || null) as ProficiencyLevel | null; })}
                    />
                  </ObjectRow>
                ))}
              </div>
              {editable && <AddInput placeholder="Add a skill…" onAdd={addSkill} />}
            </Section>

            {/* Technologies */}
            {job.technologies && job.technologies.length > 0 && (
              <Section title="Technologies" onRemove={editable ? () => edit((jr) => (jr.technologies = null)) : undefined}>
                <div className="space-y-1.5">
                  {job.technologies.map((t, i) => (
                    <ObjectRow key={i} onDelete={editable ? () => edit((jr) => jr.technologies?.splice(i, 1)) : undefined}>
                      <span className="flex-1 text-sm font-medium text-slate-800">{t.technology}</span>
                      <EnumSelect
                        value={t.priority}
                        options={ImportanceLevel.options}
                        disabled={!editable}
                        onChange={(v) => edit((jr) => { const x = jr.technologies?.[i]; if (x) x.priority = v as ImportanceLevel; })}
                      />
                    </ObjectRow>
                  ))}
                </div>
              </Section>
            )}

            {/* Languages */}
            {job.language_proficiency && job.language_proficiency.length > 0 && (
              <Section title="Languages" onRemove={editable ? () => edit((jr) => (jr.language_proficiency = null)) : undefined}>
                <div className="space-y-1.5">
                  {job.language_proficiency.map((l, i) => (
                    <ObjectRow key={i} onDelete={editable ? () => edit((jr) => jr.language_proficiency?.splice(i, 1)) : undefined}>
                      <span className="flex-1 text-sm font-medium text-slate-800">{l.language}</span>
                      <EnumSelect
                        value={l.level}
                        options={LanguageLevel.options}
                        disabled={!editable}
                        onChange={(v) => edit((jr) => { const x = jr.language_proficiency?.[i]; if (x) x.level = v as LanguageLevel; })}
                      />
                      <EnumSelect
                        value={l.priority}
                        options={ImportanceLevel.options}
                        disabled={!editable}
                        onChange={(v) => edit((jr) => { const x = jr.language_proficiency?.[i]; if (x) x.priority = v as ImportanceLevel; })}
                      />
                    </ObjectRow>
                  ))}
                </div>
              </Section>
            )}

            {/* Experience */}
            {job.experience && (
              <Section title="Experience" onRemove={editable ? () => edit((jr) => (jr.experience = null)) : undefined}>
                <div className="space-y-3">
                  <EnumRow
                    label="Seniority"
                    value={job.experience.level ?? ""}
                    options={SeniorityLevel.options}
                    editable={editable}
                    onChange={(v) => edit((jr) => { if (jr.experience) jr.experience.level = (v || null) as SeniorityLevel | null; })}
                  />
                  {job.experience.years_total && (
                    <Field
                      label="Years (total)"
                      value={`${job.experience.years_total.min ?? "?"}–${job.experience.years_total.max ?? "?"}`}
                    />
                  )}
                  {job.experience.industry_experience && job.experience.industry_experience.length > 0 && (
                    <div className="space-y-1.5">
                      {job.experience.industry_experience.map((ind, i) => (
                        <ObjectRow
                          key={i}
                          onDelete={editable ? () => edit((jr) => jr.experience?.industry_experience?.splice(i, 1)) : undefined}
                        >
                          <span className="flex-1 text-sm text-slate-700">{ind.industry}</span>
                          <EnumSelect
                            value={ind.priority}
                            options={ImportanceLevel.options}
                            disabled={!editable}
                            onChange={(v) => edit((jr) => { const x = jr.experience?.industry_experience?.[i]; if (x) x.priority = v as ImportanceLevel; })}
                          />
                        </ObjectRow>
                      ))}
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* Location */}
            {job.location && (
              <Section title="Location" onRemove={editable ? () => edit((jr) => (jr.location = null)) : undefined}>
                <div className="space-y-3">
                  <EnumRow
                    label="Work mode"
                    value={job.location.remote_options ?? ""}
                    options={RemoteOption.options}
                    editable={editable}
                    onChange={(v) => edit((jr) => { if (jr.location) jr.location.remote_options = (v || null) as RemoteOption | null; })}
                  />
                  {job.location.cities && job.location.cities.length > 0 && (
                    <StringChips
                      label="Cities"
                      items={job.location.cities}
                      editable={editable}
                      onDelete={(i) => edit((jr) => jr.location?.cities?.splice(i, 1))}
                      onAdd={(v) => edit((jr) => { if (jr.location) jr.location.cities = [...(jr.location.cities ?? []), v]; })}
                      addPlaceholder="Add city…"
                    />
                  )}
                </div>
              </Section>
            )}

            {/* Employment */}
            {job.employment_details && (
              <Section title="Employment" onRemove={editable ? () => edit((jr) => (jr.employment_details = null)) : undefined}>
                <div className="space-y-3">
                  <EnumRow
                    label="Type"
                    value={job.employment_details.type ?? ""}
                    options={EmploymentType.options}
                    editable={editable}
                    onChange={(v) => edit((jr) => { if (jr.employment_details) jr.employment_details.type = (v || null) as EmploymentType | null; })}
                  />
                  <EnumRow
                    label="Urgency"
                    value={job.employment_details.urgency ?? ""}
                    options={UrgencyLevel.options}
                    editable={editable}
                    onChange={(v) => edit((jr) => { if (jr.employment_details) jr.employment_details.urgency = (v || null) as UrgencyLevel | null; })}
                    onDelete={
                      editable && job.employment_details.urgency
                        ? () => edit((jr) => { if (jr.employment_details) jr.employment_details.urgency = null; })
                        : undefined
                    }
                  />
                </div>
              </Section>
            )}

            {/* Soft skills */}
            {job.soft_skills && job.soft_skills.length > 0 && (
              <Section title="Soft skills" onRemove={editable ? () => edit((jr) => (jr.soft_skills = null)) : undefined}>
                <div className="space-y-1.5">
                  {job.soft_skills.map((s, i) => (
                    <ObjectRow key={i} onDelete={editable ? () => edit((jr) => jr.soft_skills?.splice(i, 1)) : undefined}>
                      <span className="flex-1 text-sm font-medium text-slate-800">{s.skill}</span>
                      <EnumSelect
                        value={s.priority}
                        options={ImportanceLevel.options}
                        disabled={!editable}
                        onChange={(v) => edit((jr) => { const x = jr.soft_skills?.[i]; if (x) x.priority = v as ImportanceLevel; })}
                      />
                    </ObjectRow>
                  ))}
                </div>
              </Section>
            )}

            {/* Project context */}
            {job.project_context && (
              <Section title="Project context" onRemove={editable ? () => edit((jr) => (jr.project_context = null)) : undefined}>
                <div className="space-y-3">
                  <EnumRow
                    label="Environment"
                    value={job.project_context.environment ?? ""}
                    options={EnvironmentType.options}
                    editable={editable}
                    onChange={(v) => edit((jr) => { if (jr.project_context) jr.project_context.environment = (v || null) as EnvironmentType | null; })}
                  />
                  {job.project_context.types && job.project_context.types.length > 0 && (
                    <StringChips
                      label="Types"
                      items={job.project_context.types}
                      editable={editable}
                      onDelete={(i) => edit((jr) => jr.project_context?.types?.splice(i, 1))}
                      onAdd={(v) => edit((jr) => { if (jr.project_context) jr.project_context.types = [...(jr.project_context.types ?? []), v]; })}
                      addPlaceholder="Add type…"
                    />
                  )}
                </div>
              </Section>
            )}

            {/* Team context */}
            {job.team_context && (
              <Section title="Team context" onRemove={editable ? () => edit((jr) => (jr.team_context = null)) : undefined}>
                <div className="space-y-3">
                  {job.team_context.structure && <Field label="Structure" value={job.team_context.structure} />}
                  {job.team_context.reporting_to && <Field label="Reports to" value={job.team_context.reporting_to} />}
                </div>
              </Section>
            )}

            {/* Cultural fit */}
            {job.cultural_fit?.work_style && job.cultural_fit.work_style.length > 0 && (
              <Section title="Work style" onRemove={editable ? () => edit((jr) => (jr.cultural_fit = null)) : undefined}>
                <StringChips
                  items={job.cultural_fit.work_style}
                  editable={editable}
                  onDelete={(i) => edit((jr) => jr.cultural_fit?.work_style?.splice(i, 1))}
                  onAdd={(v) => edit((jr) => { if (jr.cultural_fit) jr.cultural_fit.work_style = [...(jr.cultural_fit.work_style ?? []), v]; })}
                  addPlaceholder="Add work style…"
                />
              </Section>
            )}
          </div>
        </div>
      </div>

      {/* anchored CTA */}
      <div className="flex shrink-0 items-center justify-between gap-4 border-t border-slate-200 bg-white px-6 py-4">
        {frozen ? (
          <>
            <p className="text-sm text-slate-500">
              <Lock className="mr-1 inline size-3.5 -translate-y-px" />
              Frozen {pos.jd.frozenAt ? relativeTime(pos.jd.frozenAt) : "just now"}. Scored once, no re-editing.
            </p>
            <Button size="lg" onClick={() => goTo("shortlist")}>
              View Shortlist →
            </Button>
          </>
        ) : (
          <>
            <p className="max-w-md text-sm text-slate-500">
              Once you freeze the role, candidates are scored against it and it can no longer be edited.
            </p>
            <Button size="lg" onClick={freeze}>
              Freeze &amp; Score →
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------

function Section({
  title,
  subtitle,
  children,
  className,
  onRemove,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  onRemove?: () => void;
}) {
  return (
    <section className={cn("rounded-xl border border-slate-200 bg-white p-5 shadow-sm", className)}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="section-label">{title}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
        </div>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-slate-400 transition hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="size-3.5" /> Remove
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="truncate text-sm font-medium capitalize text-slate-700">{value}</span>
    </div>
  );
}

function EnumSelect({
  value,
  options,
  onChange,
  disabled,
  allowEmpty,
  emptyLabel = "—",
}: {
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
  disabled?: boolean;
  allowEmpty?: boolean;
  emptyLabel?: string;
}) {
  return (
    <Select value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
      {allowEmpty && <option value="">{emptyLabel}</option>}
      {options.map((o) => (
        <option key={o} value={o}>
          {o.replace(/_/g, " ")}
        </option>
      ))}
    </Select>
  );
}

function EnumRow({
  label,
  value,
  options,
  onChange,
  editable,
  onDelete,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
  editable: boolean;
  onDelete?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-slate-400">{label}</span>
      <div className="flex items-center gap-1.5">
        <EnumSelect value={value} options={options} onChange={onChange} disabled={!editable} allowEmpty emptyLabel="—" />
        {onDelete && <IconX onClick={onDelete} />}
      </div>
    </div>
  );
}

function ObjectRow({ children, onDelete }: { children: React.ReactNode; onDelete?: () => void }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2">
      {children}
      {onDelete && <IconX onClick={onDelete} />}
    </div>
  );
}

function BulletList({
  items,
  editable,
  onDelete,
  onAdd,
  addPlaceholder,
}: {
  items: string[];
  editable: boolean;
  onDelete: (i: number) => void;
  onAdd?: (v: string) => void;
  addPlaceholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      {items.map((r, i) => (
        <div key={i} className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2">
          <span className="mt-1.5 size-1 shrink-0 rounded-full bg-slate-300" />
          <span className="flex-1 text-sm text-slate-700">{r}</span>
          {editable && <IconX onClick={() => onDelete(i)} />}
        </div>
      ))}
      {editable && onAdd && <AddInput placeholder={addPlaceholder ?? "Add…"} onAdd={onAdd} />}
    </div>
  );
}

function StringChips({
  label,
  items,
  editable,
  onDelete,
  onAdd,
  addPlaceholder,
}: {
  label?: string;
  items: string[];
  editable: boolean;
  onDelete: (i: number) => void;
  onAdd?: (v: string) => void;
  addPlaceholder?: string;
}) {
  return (
    <div className={cn(label && "mt-3")}>
      {label && <p className="mb-1.5 text-xs text-slate-400">{label}</p>}
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 rounded-md bg-slate-100 py-1 pl-2 pr-1 text-xs font-medium capitalize text-slate-600"
          >
            {item}
            {editable && <IconX onClick={() => onDelete(i)} small />}
          </span>
        ))}
      </div>
      {editable && onAdd && <AddInput placeholder={addPlaceholder ?? "Add…"} onAdd={onAdd} />}
    </div>
  );
}

function AddInput({ placeholder, onAdd }: { placeholder: string; onAdd: (v: string) => void }) {
  const [value, setValue] = useState("");
  const submit = () => {
    if (!value.trim()) return;
    onAdd(value.trim());
    setValue("");
  };
  return (
    <div className="mt-2 flex gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder={placeholder}
        className="h-8 max-w-xs text-xs"
      />
      <Button variant="secondary" size="sm" onClick={submit}>
        <Plus className="size-3.5" /> Add
      </Button>
    </div>
  );
}

function IconX({ onClick, small = false }: { onClick: () => void; small?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded p-0.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
      aria-label="Delete"
    >
      <X className={small ? "size-3" : "size-3.5"} />
    </button>
  );
}
