import { users } from "@/db/schema";
import path from "path";

export type UserSelect = typeof users.$inferSelect;

export function formatUserResponse(user: UserSelect) {
  let profileImageUrl: string | null = null;
  if (user.profileImagePath) {
    const filename = path.basename(user.profileImagePath);
    profileImageUrl = `/uploads/profile_pics/${filename}`;
  }

  return {
    id: user.id,
    email: user.email,
    display_name: user.displayName,
    gender: user.gender,
    birthday: user.birthday,
    height_cm: user.heightCm,
    target_weight_kg: user.targetWeightKg,
    profile_image_path: user.profileImagePath,
    profile_image_url: profileImageUrl,
    preferred_language: user.preferredLanguage,
    email_confirmed: user.emailConfirmed,
    pending_email: user.pendingEmail,
    created_at: user.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString(),
  };
}
