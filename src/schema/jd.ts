import { z } from "zod";
import {
  ImportanceLevel,
  ProficiencyLevel,
  LanguageLevel,
  SeniorityLevel,
  RemoteOption,
  EmploymentType,
  UrgencyLevel,
  PayFrequency,
  CompanySize,
  CompanyStage,
  EnvironmentType,
  FieldSource,
} from "./enums";

// ---------------------------------------------------------------------------
// StructuredJD — a faithful mirror of JobRoleSchema.py (snake_case) so the app
// can parse the offline extraction output (hr_assistant_prime_ac.json) as-is.
// Optional fields use .nullish() to match Pydantic Optional + the JSON's nulls.
// ---------------------------------------------------------------------------

export const SkillSchema = z.object({
  skill: z.string(),
  priority: ImportanceLevel,
  proficiency_level: ProficiencyLevel.nullish(),
});

export const TechnologySchema = z.object({
  technology: z.string(),
  priority: ImportanceLevel,
  version: z.string().nullish(),
});

export const LanguageProficiencySchema = z.object({
  language: z.string(),
  level: LanguageLevel,
  priority: ImportanceLevel,
});

export const EducationSchema = z.object({
  degree: z.string(),
  field: z.string().nullish(),
  priority: ImportanceLevel,
});

export const CertificationSchema = z.object({
  certification: z.string(),
  priority: ImportanceLevel,
  timeline: z.string().nullish(),
});

export const QualificationsSchema = z.object({
  education: z.array(EducationSchema).nullish(),
  certifications: z.array(CertificationSchema).nullish(),
});

export const ExperienceRangeSchema = z.object({
  min: z.number().int().nullish(),
  max: z.number().int().nullish(),
});

export const IndustryExperienceSchema = z.object({
  industry: z.string(),
  priority: ImportanceLevel,
});

export const LeadershipSchema = z.object({
  required: z.boolean().nullish(),
  team_size: ExperienceRangeSchema.nullish(),
  priority: ImportanceLevel.nullish(),
});

export const ExperienceSchema = z.object({
  level: SeniorityLevel.nullish(),
  years_total: ExperienceRangeSchema.nullish(),
  years_relevant: ExperienceRangeSchema.nullish(),
  industry_experience: z.array(IndustryExperienceSchema).nullish(),
  leadership: LeadershipSchema.nullish(),
});

export const LocationTravelRequirementsSchema = z.object({
  percentage: z.number().int().nullish(),
  frequency: z.string().nullish(),
});

export const RelocationSchema = z.object({
  assistance_available: z.boolean().nullish(),
  required: z.boolean().nullish(),
});

export const LocationSchema = z.object({
  cities: z.array(z.string()).nullish(),
  countries: z.array(z.string()).nullish(),
  remote_options: RemoteOption.nullish(),
  travel_requirements: LocationTravelRequirementsSchema.nullish(),
  relocation: RelocationSchema.nullish(),
});

export const SalaryRangeSchema = z.object({
  min: z.number().nullish(),
  max: z.number().nullish(),
  currency: z.string().nullish(),
  frequency: PayFrequency.nullish(),
});

export const EmploymentDetailsSchema = z.object({
  type: EmploymentType.nullish(),
  urgency: UrgencyLevel.nullish(),
  salary_range: SalaryRangeSchema.nullish(),
  benefits: z.array(z.string()).nullish(),
});

export const SoftSkillSchema = z.object({
  skill: z.string(),
  priority: ImportanceLevel,
  context: z.string().nullish(),
});

export const ProjectContextSchema = z.object({
  types: z.array(z.string()).nullish(),
  methodologies: z.array(z.string()).nullish(),
  environment: EnvironmentType.nullish(),
});

export const TeamContextSchema = z.object({
  size: z.number().int().nullish(),
  structure: z.string().nullish(),
  reporting_to: z.string().nullish(),
});

export const SecurityClearanceSchema = z.object({
  required: z.boolean().nullish(),
  level: z.string().nullish(),
});

export const ComplianceLegalSchema = z.object({
  visa_sponsorship: z.boolean().nullish(),
  security_clearance: SecurityClearanceSchema.nullish(),
  background_check: z.boolean().nullish(),
});

export const CulturalFitSchema = z.object({
  company_values: z.array(z.string()).nullish(),
  work_style: z.array(z.string()).nullish(),
});

export const CompanySchema = z.object({
  name: z.string(),
  size: CompanySize.nullish(),
  stage: CompanyStage.nullish(),
});

/** The JD extracted from raw text — mirror of JobRoleSchema.py. */
export const JobRoleSchema = z.object({
  role: z.string(),
  company: CompanySchema,
  industry: z.array(z.string()).nullish(),
  role_objectives: z.array(z.string()).nullish(),
  responsibilities: z.array(z.string()),
  skills: z.array(SkillSchema),
  technologies: z.array(TechnologySchema).nullish(),
  language_proficiency: z.array(LanguageProficiencySchema).nullish(),
  qualifications: QualificationsSchema.nullish(),
  experience: ExperienceSchema.nullish(),
  location: LocationSchema.nullish(),
  employment_details: EmploymentDetailsSchema.nullish(),
  soft_skills: z.array(SoftSkillSchema).nullish(),
  project_context: ProjectContextSchema.nullish(),
  team_context: TeamContextSchema.nullish(),
  compliance_legal: ComplianceLegalSchema.nullish(),
  cultural_fit: CulturalFitSchema.nullish(),
  growth_opportunities: z.array(z.string()).nullish(),
});
export type JobRole = z.infer<typeof JobRoleSchema>;

/**
 * The app-level JD entity: the extracted JobRole plus demo metadata.
 * Tuned once by the recruiter at upload, then frozen (ADR 0005).
 */
export const StructuredJDSchema = z.object({
  id: z.string(),
  jobRole: JobRoleSchema,
  frozen: z.boolean().default(false),
  /** field path → who last set it; the raw extraction has none. */
  fieldSources: z.record(z.string(), FieldSource).optional(),
  createdAt: z.string().datetime(),
  frozenAt: z.string().datetime().nullish(),
});
export type StructuredJD = z.infer<typeof StructuredJDSchema>;
