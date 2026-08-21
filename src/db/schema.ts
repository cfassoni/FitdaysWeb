import {
  sqliteTable,
  integer,
  text,
  real,
  unique,
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// -----------------------------------------------------------------------------
// Users
// -----------------------------------------------------------------------------
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  hashedPassword: text("hashed_password").notNull(),
  displayName: text("display_name"),
  gender: text("gender"),
  birthday: text("birthday"),
  heightCm: real("height_cm"),
  targetWeightKg: real("target_weight_kg"),
  profileImagePath: text("profile_image_path"),
  preferredLanguage: text("preferred_language"),
  emailConfirmed: integer("email_confirmed", { mode: "boolean" }).notNull().default(false),
  pendingEmail: text("pending_email"),
  verificationCode: text("verification_code"),
  verificationCodeExpiresAt: integer("verification_code_expires_at", { mode: "timestamp" }),
  verificationAttempts: integer("verification_attempts").notNull().default(0),
  resetPasswordToken: text("reset_password_token"),
  resetPasswordCode: text("reset_password_code"),
  resetPasswordExpiresAt: integer("reset_password_expires_at", { mode: "timestamp" }),
  resetPasswordAttempts: integer("reset_password_attempts").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const usersRelations = relations(users, ({ many }) => ({
  records: many(recompRecords),
  sharedLinks: many(sharedLinks),
}));

// -----------------------------------------------------------------------------
// Recomp Records (formerly fitdays_records)
// -----------------------------------------------------------------------------
export const recompRecords = sqliteTable("recomp_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: integer("date", { mode: "timestamp" }).notNull(),

  // Core Weight / Body Metrics
  weight: real("weight").notNull(),
  bmi: real("bmi").notNull(),
  bodyFatPct: real("body_fat_pct").notNull(),
  subcutaneousFatPct: real("subcutaneous_fat_pct").notNull(),
  heartRate: real("heart_rate"),
  heartIndex: real("heart_index"),
  visceralFat: real("visceral_fat").notNull(),
  bodyWaterPct: real("body_water_pct").notNull(),
  skeletalMuscleMassPct: real("skeletal_muscle_mass_pct").notNull(),
  muscleMass: real("muscle_mass").notNull(),
  boneMass: real("bone_mass").notNull(),
  proteinPct: real("protein_pct").notNull(),
  bmr: real("bmr").notNull(),
  metabolicAge: real("metabolic_age").notNull(),
  fatMass: real("fat_mass").notNull(),
  moistureContent: real("moisture_content").notNull(),
  skeletalMuscleMass: real("skeletal_muscle_mass").notNull(),
  muscleRatePct: real("muscle_rate_pct").notNull(),
  proteinMass: real("protein_mass").notNull(),
  obesityScore: integer("obesity_score").notNull(),
  fatFreeMass: real("fat_free_mass").notNull(),
  smi: real("smi").notNull(),
  bodyScore: real("body_score").notNull(),
  targetWeight: real("target_weight").notNull(),
  weightControl: real("weight_control").notNull(),
  fatControl: real("fat_control").notNull(),
  muscleControl: real("muscle_control").notNull(),

  // Right Arm Segmental Analysis
  rightArmFatMass: real("right_arm_fat_mass"),
  rightArmFatPct: real("right_arm_fat_pct"),
  rightArmFatLevel: text("right_arm_fat_level"),
  rightArmMuscleMass: real("right_arm_muscle_mass"),
  rightArmMusclePct: real("right_arm_muscle_pct"),
  rightArmMuscleLevel: text("right_arm_muscle_level"),
  rightArmImpedanceHigh: real("right_arm_impedance_high"),
  rightArmImpedanceLow: real("right_arm_impedance_low"),

  // Left Arm Segmental Analysis
  leftArmFatMass: real("left_arm_fat_mass"),
  leftArmFatPct: real("left_arm_fat_pct"),
  leftArmFatLevel: text("left_arm_fat_level"),
  leftArmMuscleMass: real("left_arm_muscle_mass"),
  leftArmMusclePct: real("left_arm_muscle_pct"),
  leftArmMuscleLevel: text("left_arm_muscle_level"),
  leftArmImpedanceHigh: real("left_arm_impedance_high"),
  leftArmImpedanceLow: real("left_arm_impedance_low"),

  // Trunk Segmental Analysis
  trunkFatMass: real("trunk_fat_mass"),
  trunkFatPct: real("trunk_fat_pct"),
  trunkFatLevel: text("trunk_fat_level"),
  trunkMuscleMass: real("trunk_muscle_mass"),
  trunkMusclePct: real("trunk_muscle_pct"),
  trunkMuscleLevel: text("trunk_muscle_level"),
  trunkImpedanceHigh: real("trunk_impedance_high"),
  trunkImpedanceLow: real("trunk_impedance_low"),

  // Right Leg Segmental Analysis
  rightLegFatMass: real("right_leg_fat_mass"),
  rightLegFatPct: real("right_leg_fat_pct"),
  rightLegFatLevel: text("right_leg_fat_level"),
  rightLegMuscleMass: real("right_leg_muscle_mass"),
  rightLegMusclePct: real("right_leg_muscle_pct"),
  rightLegMuscleLevel: text("right_leg_muscle_level"),
  rightLegImpedanceHigh: real("right_leg_impedance_high"),
  rightLegImpedanceLow: real("right_leg_impedance_low"),

  // Left Leg Segmental Analysis
  leftLegFatMass: real("left_leg_fat_mass"),
  leftLegFatPct: real("left_leg_fat_pct"),
  leftLegFatLevel: text("left_leg_fat_level"),
  leftLegMuscleMass: real("left_leg_muscle_mass"),
  leftLegMusclePct: real("left_leg_muscle_pct"),
  leftLegMuscleLevel: text("left_leg_muscle_level"),
  leftLegImpedanceHigh: real("left_leg_impedance_high"),
  leftLegImpedanceLow: real("left_leg_impedance_low"),
}, (table) => [
  unique("_user_date_uc").on(table.userId, table.date)
]);

export const recompRecordsRelations = relations(recompRecords, ({ one }) => ({
  user: one(users, {
    fields: [recompRecords.userId],
    references: [users.id],
  }),
  report: one(recompReports, {
    fields: [recompRecords.id],
    references: [recompReports.recordId],
  }),
}));

// -----------------------------------------------------------------------------
// Recomp Reports (formerly fitdays_reports)
// -----------------------------------------------------------------------------
export const recompReports = sqliteTable("recomp_reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  recordId: integer("record_id").notNull().unique().references(() => recompRecords.id, { onDelete: "cascade" }),
  filePath: text("file_path").notNull(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  fileSize: integer("file_size").notNull(),
  uploadedAt: integer("uploaded_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const recompReportsRelations = relations(recompReports, ({ one }) => ({
  record: one(recompRecords, {
    fields: [recompReports.recordId],
    references: [recompRecords.id],
  }),
}));

// -----------------------------------------------------------------------------
// Shared Links
// -----------------------------------------------------------------------------
export const sharedLinks = sqliteTable("shared_links", {
  id: text("id").primaryKey(), // Using UUIDs or similar as IDs
  ownerId: integer("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  description: text("description").notNull(),
  passwordHash: text("password_hash"),
  includeAttachments: integer("include_attachments", { mode: "boolean" }).notNull().default(true),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  snapshotData: text("snapshot_data").notNull(), // JSON string
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const sharedLinksRelations = relations(sharedLinks, ({ one, many }) => ({
  owner: one(users, {
    fields: [sharedLinks.ownerId],
    references: [users.id],
  }),
  auditLogs: many(sharedLinkAuditLogs),
}));

// -----------------------------------------------------------------------------
// Shared Link Audit Logs
// -----------------------------------------------------------------------------
export const sharedLinkAuditLogs = sqliteTable("shared_link_audit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sharedLinkId: text("shared_link_id").notNull().references(() => sharedLinks.id, { onDelete: "cascade" }),
  accessedAt: integer("accessed_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  status: text("status").notNull(),
});

export const sharedLinkAuditLogsRelations = relations(sharedLinkAuditLogs, ({ one }) => ({
  sharedLink: one(sharedLinks, {
    fields: [sharedLinkAuditLogs.sharedLinkId],
    references: [sharedLinks.id],
  }),
}));
