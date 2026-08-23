export function isSwaggerEnabled(): boolean {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }
  return process.env.ENABLE_SWAGGER === "true";
}

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "FitdaysWeb / Recomp Pro API",
    version: "0.4.0",
    description: "Interactive Swagger API documentation for Next.js 16 Route Handlers and Drizzle ORM backend. Available in development & testing environments.",
  },
  servers: [
    {
      url: "/",
      description: "Current environment server",
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT access token",
      },
    },
    schemas: {
      UserResponse: {
        type: "object",
        properties: {
          id: { type: "integer" },
          email: { type: "string", format: "email" },
          display_name: { type: "string" },
          gender: { type: "string", enum: ["male", "female"] },
          birthday: { type: "string", format: "date" },
          height_cm: { type: "number" },
          target_weight_kg: { type: "number" },
          profile_image_path: { type: "string", nullable: true },
          profile_image_url: { type: "string", nullable: true },
          preferred_language: { type: "string" },
          email_confirmed: { type: "boolean" },
          pending_email: { type: "string", nullable: true },
          created_at: { type: "string", format: "date-time" },
        },
      },
      TokenResponse: {
        type: "object",
        properties: {
          access_token: { type: "string" },
          token_type: { type: "string", example: "bearer" },
        },
      },
      MessageResponse: {
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
      ReportResponse: {
        type: "object",
        properties: {
          id: { type: "integer" },
          record_id: { type: "integer" },
          filename: { type: "string" },
          mime_type: { type: "string" },
          file_size: { type: "integer" },
          uploaded_at: { type: "string", format: "date-time" },
          url: { type: "string" },
        },
      },
      FitdaysRecord: {
        type: "object",
        properties: {
          id: { type: "integer" },
          user_id: { type: "integer" },
          date: { type: "string", format: "date-time" },
          weight: { type: "number" },
          bmi: { type: "number" },
          body_fat_pct: { type: "number" },
          subcutaneous_fat_pct: { type: "number" },
          heart_rate: { type: "number", nullable: true },
          heart_index: { type: "number", nullable: true },
          visceral_fat: { type: "number" },
          body_water_pct: { type: "number" },
          skeletal_muscle_mass_pct: { type: "number" },
          muscle_mass: { type: "number" },
          bone_mass: { type: "number" },
          protein_pct: { type: "number" },
          bmr: { type: "number" },
          metabolic_age: { type: "number" },
          fat_mass: { type: "number" },
          moisture_content: { type: "number" },
          skeletal_muscle_mass: { type: "number" },
          muscle_rate_pct: { type: "number" },
          protein_mass: { type: "number" },
          obesity_score: { type: "integer" },
          fat_free_mass: { type: "number" },
          smi: { type: "number" },
          body_score: { type: "number" },
          target_weight: { type: "number" },
          weight_control: { type: "number" },
          fat_control: { type: "number" },
          muscle_control: { type: "number" },
          right_arm_fat_mass: { type: "number", nullable: true },
          right_arm_fat_pct: { type: "number", nullable: true },
          right_arm_fat_level: { type: "string", nullable: true },
          right_arm_muscle_mass: { type: "number", nullable: true },
          right_arm_muscle_pct: { type: "number", nullable: true },
          right_arm_muscle_level: { type: "string", nullable: true },
          right_arm_impedance_high: { type: "number", nullable: true },
          right_arm_impedance_low: { type: "number", nullable: true },
          left_arm_fat_mass: { type: "number", nullable: true },
          left_arm_fat_pct: { type: "number", nullable: true },
          left_arm_fat_level: { type: "string", nullable: true },
          left_arm_muscle_mass: { type: "number", nullable: true },
          left_arm_muscle_pct: { type: "number", nullable: true },
          left_arm_muscle_level: { type: "string", nullable: true },
          left_arm_impedance_high: { type: "number", nullable: true },
          left_arm_impedance_low: { type: "number", nullable: true },
          trunk_fat_mass: { type: "number", nullable: true },
          trunk_fat_pct: { type: "number", nullable: true },
          trunk_fat_level: { type: "string", nullable: true },
          trunk_muscle_mass: { type: "number", nullable: true },
          trunk_muscle_pct: { type: "number", nullable: true },
          trunk_muscle_level: { type: "string", nullable: true },
          trunk_impedance_high: { type: "number", nullable: true },
          trunk_impedance_low: { type: "number", nullable: true },
          right_leg_fat_mass: { type: "number", nullable: true },
          right_leg_fat_pct: { type: "number", nullable: true },
          right_leg_fat_level: { type: "string", nullable: true },
          right_leg_muscle_mass: { type: "number", nullable: true },
          right_leg_muscle_pct: { type: "number", nullable: true },
          right_leg_muscle_level: { type: "string", nullable: true },
          right_leg_impedance_high: { type: "number", nullable: true },
          right_leg_impedance_low: { type: "number", nullable: true },
          left_leg_fat_mass: { type: "number", nullable: true },
          left_leg_fat_pct: { type: "number", nullable: true },
          left_leg_fat_level: { type: "string", nullable: true },
          left_leg_muscle_mass: { type: "number", nullable: true },
          left_leg_muscle_pct: { type: "number", nullable: true },
          left_leg_muscle_level: { type: "string", nullable: true },
          left_leg_impedance_high: { type: "number", nullable: true },
          left_leg_impedance_low: { type: "number", nullable: true },
          report: { $ref: "#/components/schemas/ReportResponse" },
        },
      },
      DashboardSummary: {
        type: "object",
        properties: {
          total_records: { type: "integer" },
          first_record_date: { type: "string", format: "date-time", nullable: true },
          latest_record_date: { type: "string", format: "date-time", nullable: true },
          starting_weight: { type: "number" },
          current_weight: { type: "number" },
          weight_change: { type: "number" },
          starting_body_fat: { type: "number" },
          current_body_fat: { type: "number" },
          body_fat_change: { type: "number" },
          starting_muscle_mass: { type: "number" },
          current_muscle_mass: { type: "number" },
          muscle_mass_change: { type: "number" },
          weight_history: {
            type: "array",
            items: {
              type: "object",
              properties: {
                date: { type: "string", format: "date-time" },
                weight: { type: "number" },
                body_fat_pct: { type: "number" },
                body_fat_mass: { type: "number" },
                muscle_mass: { type: "number" },
                skeletal_muscle_mass: { type: "number" },
                skeletal_muscle_mass_pct: { type: "number" },
              },
            },
          },
        },
      },
      SharedLinkResponse: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          token: { type: "string" },
          description: { type: "string" },
          has_password: { type: "boolean" },
          include_attachments: { type: "boolean" },
          expires_at: { type: "string", format: "date-time", nullable: true },
          created_at: { type: "string", format: "date-time" },
          entry_count: { type: "integer" },
          access_count: { type: "integer" },
          last_accessed_at: { type: "string", format: "date-time", nullable: true },
        },
      },
      PublicSharedLinkMeta: {
        type: "object",
        properties: {
          token: { type: "string" },
          description: { type: "string" },
          has_password: { type: "boolean" },
          expires_at: { type: "string", format: "date-time", nullable: true },
          created_at: { type: "string", format: "date-time" },
          entry_count: { type: "integer" },
        },
      },
    },
  },
  paths: {
    // ----------------- Users & Authentication -----------------
    "/api/users/register": {
      post: {
        tags: ["Users & Auth"],
        summary: "Register user account",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password", "display_name", "gender", "birthday", "height_cm", "target_weight_kg"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 6 },
                  display_name: { type: "string" },
                  gender: { type: "string", enum: ["male", "female"] },
                  birthday: { type: "string", example: "1990-01-01" },
                  height_cm: { type: "number", example: 180 },
                  target_weight_kg: { type: "number", example: 75 },
                  preferred_language: { type: "string", example: "en" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "User registered successfully", content: { "application/json": { schema: { $ref: "#/components/schemas/UserResponse" } } } },
          400: { description: "Email already registered" },
        },
      },
    },
    "/api/users/login": {
      post: {
        tags: ["Users & Auth"],
        summary: "Login and obtain JWT access token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Access token granted", content: { "application/json": { schema: { $ref: "#/components/schemas/TokenResponse" } } } },
          401: { description: "Incorrect credentials" },
          403: { description: "Email unconfirmed (EMAIL_NOT_CONFIRMED)" },
        },
      },
    },
    "/api/users/verify-code": {
      post: {
        tags: ["Users & Auth"],
        summary: "Verify account via 6-digit email OTP code",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "code"],
                properties: {
                  email: { type: "string", format: "email" },
                  code: { type: "string", example: "123456" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Email verified successfully", content: { "application/json": { schema: { $ref: "#/components/schemas/MessageResponse" } } } },
          400: { description: "Invalid or expired code" },
        },
      },
    },
    "/api/users/verify-email": {
      get: {
        tags: ["Users & Auth"],
        summary: "Verify email address via direct email link",
        parameters: [
          { name: "email", in: "query", required: true, schema: { type: "string" } },
          { name: "code", in: "query", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Email verified", content: { "application/json": { schema: { $ref: "#/components/schemas/MessageResponse" } } } },
          400: { description: "Invalid or expired code" },
        },
      },
    },
    "/api/users/resend-verification": {
      post: {
        tags: ["Users & Auth"],
        summary: "Resend verification code to email",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: { email: { type: "string", format: "email" } },
              },
            },
          },
        },
        responses: {
          200: { description: "Verification code resent if account exists", content: { "application/json": { schema: { $ref: "#/components/schemas/MessageResponse" } } } },
        },
      },
    },
    "/api/users/forgot-password": {
      post: {
        tags: ["Users & Auth"],
        summary: "Request password reset code / link",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: { email: { type: "string", format: "email" } },
              },
            },
          },
        },
        responses: {
          200: { description: "Reset instructions sent if email exists", content: { "application/json": { schema: { $ref: "#/components/schemas/MessageResponse" } } } },
        },
      },
    },
    "/api/users/validate-reset-token": {
      post: {
        tags: ["Users & Auth"],
        summary: "Validate password reset token or 6-digit code",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: {
                  email: { type: "string", format: "email" },
                  token: { type: "string" },
                  code: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Reset token valid", content: { "application/json": { schema: { type: "object", properties: { valid: { type: "boolean" } } } } } },
          400: { description: "Invalid or expired token/code" },
        },
      },
    },
    "/api/users/reset-password": {
      post: {
        tags: ["Users & Auth"],
        summary: "Set new password using validated reset token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "new_password"],
                properties: {
                  email: { type: "string", format: "email" },
                  token: { type: "string" },
                  code: { type: "string" },
                  new_password: { type: "string", minLength: 6 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Password reset successfully", content: { "application/json": { schema: { $ref: "#/components/schemas/TokenResponse" } } } },
        },
      },
    },
    "/api/users/me": {
      get: {
        tags: ["Users & Auth"],
        summary: "Get current user profile",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Current user profile", content: { "application/json": { schema: { $ref: "#/components/schemas/UserResponse" } } } },
          401: { description: "Unauthorized" },
        },
      },
      delete: {
        tags: ["Users & Auth"],
        summary: "Delete user account (GDPR)",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["password"],
                properties: { password: { type: "string" } },
              },
            },
          },
        },
        responses: {
          200: { description: "Account deleted", content: { "application/json": { schema: { $ref: "#/components/schemas/MessageResponse" } } } },
        },
      },
    },
    "/api/users/profile": {
      put: {
        tags: ["Users & Auth"],
        summary: "Update user profile settings",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  display_name: { type: "string" },
                  email: { type: "string", format: "email" },
                  gender: { type: "string", enum: ["male", "female"] },
                  birthday: { type: "string" },
                  height_cm: { type: "number" },
                  target_weight_kg: { type: "number" },
                  preferred_language: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Profile updated", content: { "application/json": { schema: { $ref: "#/components/schemas/UserResponse" } } } },
        },
      },
    },
    "/api/users/profile-picture": {
      post: {
        tags: ["Users & Auth"],
        summary: "Upload profile avatar picture",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: { file: { type: "string", format: "binary" } },
              },
            },
          },
        },
        responses: {
          200: { description: "Profile picture uploaded", content: { "application/json": { schema: { $ref: "#/components/schemas/UserResponse" } } } },
        },
      },
    },
    "/api/users/change-password": {
      post: {
        tags: ["Users & Auth"],
        summary: "Change account password",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["current_password", "new_password"],
                properties: {
                  current_password: { type: "string" },
                  new_password: { type: "string", minLength: 6 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Password changed successfully", content: { "application/json": { schema: { $ref: "#/components/schemas/MessageResponse" } } } },
        },
      },
    },
    "/api/users/cancel-email-change": {
      post: {
        tags: ["Users & Auth"],
        summary: "Cancel pending email update",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Pending email change cancelled", content: { "application/json": { schema: { $ref: "#/components/schemas/UserResponse" } } } },
        },
      },
    },
    "/api/users/me/delete-data": {
      post: {
        tags: ["Users & Auth"],
        summary: "Delete all user measurements and shared links",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["password"],
                properties: { password: { type: "string" } },
              },
            },
          },
        },
        responses: {
          200: { description: "All measurement data deleted", content: { "application/json": { schema: { $ref: "#/components/schemas/MessageResponse" } } } },
        },
      },
    },
    "/api/users/me/delete-account": {
      post: {
        tags: ["Users & Auth"],
        summary: "Delete user account and all personal data (GDPR POST endpoint)",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["password"],
                properties: { password: { type: "string" } },
              },
            },
          },
        },
        responses: {
          200: { description: "Account deleted", content: { "application/json": { schema: { $ref: "#/components/schemas/MessageResponse" } } } },
        },
      },
    },

    // ----------------- Fitdays Records -----------------
    "/api/records": {
      get: {
        tags: ["Records"],
        summary: "List all measurement records",
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "List of records",
            content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/FitdaysRecord" } } } },
          },
        },
      },
    },
    "/api/records/summary": {
      get: {
        tags: ["Records"],
        summary: "Get dashboard analytics summary and weight trend history",
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Summary and timeline",
            content: { "application/json": { schema: { $ref: "#/components/schemas/DashboardSummary" } } },
          },
        },
      },
    },
    "/api/records/upload": {
      post: {
        tags: ["Records"],
        summary: "Upload Fitdays Excel (.xlsx) or CSV export file",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: { file: { type: "string", format: "binary" } },
              },
            },
          },
        },
        responses: {
          201: {
            description: "File processed and records upserted",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    inserted: { type: "integer" },
                    updated: { type: "integer" },
                    total_processed: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/records/delete": {
      post: {
        tags: ["Records"],
        summary: "Delete multiple records by ID",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["record_ids"],
                properties: {
                  record_ids: { type: "array", items: { type: "integer" } },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Deleted records response",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    deleted: { type: "array", items: { type: "integer" } },
                    failed: { type: "array", items: { type: "integer" } },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/records/{record_id}/report": {
      get: {
        tags: ["Records"],
        summary: "Get PDF / image report attachment for a record",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "record_id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Report attachment metadata", content: { "application/json": { schema: { $ref: "#/components/schemas/ReportResponse" } } } },
          404: { description: "Report not found" },
        },
      },
      post: {
        tags: ["Records"],
        summary: "Attach PDF / image report to a record",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "record_id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: { file: { type: "string", format: "binary" } },
              },
            },
          },
        },
        responses: {
          201: { description: "Report uploaded", content: { "application/json": { schema: { $ref: "#/components/schemas/ReportResponse" } } } },
        },
      },
      delete: {
        tags: ["Records"],
        summary: "Delete report attachment from record",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "record_id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: { description: "Report deleted", content: { "application/json": { schema: { $ref: "#/components/schemas/MessageResponse" } } } },
        },
      },
    },

    // ----------------- Shared Links -----------------
    "/api/shared-links": {
      get: {
        tags: ["Shared Links"],
        summary: "List user's shared links",
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "List of shared links",
            content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/SharedLinkResponse" } } } },
          },
        },
      },
      post: {
        tags: ["Shared Links"],
        summary: "Create snapshot-based shared link",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["description", "entry_ids"],
                properties: {
                  description: { type: "string" },
                  entry_ids: { type: "array", items: { type: "integer" } },
                  password: { type: "string" },
                  include_attachments: { type: "boolean" },
                  expires_at: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Shared link created", content: { "application/json": { schema: { $ref: "#/components/schemas/SharedLinkResponse" } } } },
        },
      },
    },
    "/api/shared-links/{link_id}": {
      get: {
        tags: ["Shared Links"],
        summary: "Get shared link details",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "link_id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Shared link details", content: { "application/json": { schema: { $ref: "#/components/schemas/SharedLinkResponse" } } } },
        },
      },
      patch: {
        tags: ["Shared Links"],
        summary: "Update shared link expiration or password",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "link_id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  description: { type: "string" },
                  password: { type: "string" },
                  expires_at: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Shared link updated", content: { "application/json": { schema: { $ref: "#/components/schemas/SharedLinkResponse" } } } },
        },
      },
      delete: {
        tags: ["Shared Links"],
        summary: "Delete shared link",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "link_id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Shared link deleted", content: { "application/json": { schema: { $ref: "#/components/schemas/MessageResponse" } } } },
        },
      },
    },
    "/api/shared-links/public/{token}": {
      get: {
        tags: ["Shared Links"],
        summary: "Get public metadata for shared link (Guest access)",
        parameters: [{ name: "token", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Public metadata", content: { "application/json": { schema: { $ref: "#/components/schemas/PublicSharedLinkMeta" } } } },
          404: { description: "Link not found or expired" },
        },
      },
    },
    "/api/shared-links/public/{token}/verify": {
      post: {
        tags: ["Shared Links"],
        summary: "Verify password for protected shared link",
        parameters: [{ name: "token", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["password"],
                properties: { password: { type: "string" } },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Guest token issued",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    guest_token: { type: "string" },
                    token_type: { type: "string", example: "bearer" },
                    expires_in: { type: "integer", example: 3600 },
                  },
                },
              },
            },
          },
          401: { description: "Incorrect password" },
        },
      },
    },
    "/api/shared-links/public/{token}/data": {
      get: {
        tags: ["Shared Links"],
        summary: "Get snapshot data for shared link (Guest access)",
        parameters: [{ name: "token", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Shared snapshot data", content: { "application/json": { schema: { type: "object" } } } },
          401: { description: "Password required" },
          404: { description: "Link not found or expired" },
        },
      },
    },
    "/api/shared-links/public/{token}/attachments/{report_id}": {
      get: {
        tags: ["Shared Links"],
        summary: "Download report attachment via shared link (Guest access)",
        parameters: [
          { name: "token", in: "path", required: true, schema: { type: "string" } },
          { name: "report_id", in: "path", required: true, schema: { type: "integer" } },
        ],
        responses: {
          200: { description: "PDF / Image file stream" },
          401: { description: "Unauthorized" },
          404: { description: "Attachment not found" },
        },
      },
    },
  },
};
