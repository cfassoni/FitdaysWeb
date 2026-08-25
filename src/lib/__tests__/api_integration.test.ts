import { describe, it, expect, beforeAll } from "vitest";
import { NextRequest } from "next/server";
import * as XLSX from "xlsx";
import { ensureTablesExist } from "@/db/initDb";
import { POST as registerHandler } from "../../app/api/users/register/route";
import { POST as loginHandler } from "../../app/api/users/login/route";
import { GET as meHandler, DELETE as deleteAccountHandler } from "../../app/api/users/me/route";
import { PUT as updateProfileHandler } from "../../app/api/users/profile/route";
import { POST as changePasswordHandler } from "../../app/api/users/change-password/route";
import { POST as uploadRecordsHandler } from "../../app/api/records/upload/route";
import { GET as getRecordsHandler } from "../../app/api/records/route";
import { GET as getSummaryHandler } from "../../app/api/records/summary/route";
import { POST as deleteRecordsHandler } from "../../app/api/records/delete/route";
import {
  GET as getReportHandler,
  POST as uploadReportHandler,
  DELETE as deleteReportHandler,
} from "../../app/api/records/[id]/report/route";
import { POST as createSharedLinkHandler, GET as getSharedLinksHandler } from "../../app/api/shared-links/route";
import { GET as getPublicLinkHandler } from "../../app/api/shared-links/public/[token]/route";
import { POST as verifyPublicLinkHandler } from "../../app/api/shared-links/public/[token]/verify/route";
import { GET as getPublicDataHandler } from "../../app/api/shared-links/public/[token]/data/route";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const SAMPLE_CSV = `Time of Measurement,Weight(kg),BMI,Body Fat(%),Subcutaneous Fat(%),Heart Rate(bpm),Cardiac Index(L/min/m2),Visceral Fat,Body Water(%),Skeletal Muscle(%),Muscle Mass(kg),Bone Mass(kg),Protein(%),BMR(kcal),Metabolic Age,Fat Mass(kg),Water Content(kg),Skeletal Muscle Mass(kg),Muscle Rate(%),Protein Mass(kg),Obesity Level,Fat-free Weight(kg),SMI(kg/m2),Body Score,Target Weight(kg),Weight Control(kg),Fat Control(kg),Muscle Control(kg),Right Upper Extremity Fat Mass(kg),Right Upper Extremity Fat Rate(%),Right Upper Extremity Fat Level,Right Upper Extremity Muscle Mass(kg),Right Upper Extremity Muscle Rate(%),Right Upper Extremity Muscle Level,Right Upper Extremity High Frequency Resistance,Right Upper Extremity Low Frequency Resistance,Left Upper Extremity Fat Mass(kg),Left Upper Extremity Fat Rate(%),Left Upper Extremity Fat Level,Left Upper Extremity Muscle Mass(kg),Left Upper Extremity Muscle Rate(%),Left Upper Extremity Muscle Level,Left Upper Extremity High Frequency Resistance,Left Upper Extremity Low Frequency Resistance,Trunk Fat Mass(kg),Trunk Fat Rate(%),Trunk Fat Level,Trunk Muscle Mass(kg),Trunk Muscle Rate(%),Trunk Muscle Level,Trunk High Frequency Resistance,Trunk Low Frequency Resistance,Right Lower Extremity Fat Mass(kg),Right Lower Extremity Fat Rate(%),Right Lower Extremity Fat Level,Right Lower Extremity Muscle Mass(kg),Right Lower Extremity Muscle Rate(%),Right Lower Extremity Muscle Level,Right Lower Extremity High Frequency Resistance,Right Lower Extremity Low Frequency Resistance,Left Lower Extremity Fat Mass(kg),Left Lower Extremity Fat Rate(%),Left Lower Extremity Fat Level,Left Lower Extremity Muscle Mass(kg),Left Lower Extremity Muscle Rate(%),Left Lower Extremity Muscle Level,Left Lower Extremity High Frequency Resistance,Left Lower Extremity Low Frequency Resistance
2026-08-01 07:00:00,75.0,23.5,18.0,15.0,65,2.8,7,58.0,45.0,58.0,3.2,18.5,1650,28,13.5,43.5,33.8,77.3,13.9,0,61.5,8.2,85,72.0,-3.0,-2.0,1.0,1.2,16.0,Standard,3.5,75.0,Standard,320.0,360.0,1.2,16.0,Standard,3.5,75.0,Standard,320.0,360.0,7.0,19.0,Standard,28.0,76.0,Standard,30.0,35.0,2.1,17.0,Standard,9.5,78.0,Standard,260.0,300.0,2.0,16.5,Standard,9.6,78.5,Standard,260.0,300.0
2026-08-15 07:00:00,74.0,23.1,17.0,14.2,62,2.7,6,59.0,46.0,58.5,3.2,19.0,1660,27,12.6,43.7,34.0,79.1,14.1,0,61.4,8.3,88,72.0,-2.0,-1.5,0.5,1.1,15.0,Standard,3.6,76.0,Standard,315.0,355.0,1.1,15.0,Standard,3.6,76.0,Standard,315.0,355.0,6.5,18.0,Standard,28.3,77.0,Standard,29.0,34.0,2.0,16.0,Standard,9.6,79.0,Standard,255.0,295.0,1.9,15.8,Standard,9.7,79.5,Standard,255.0,295.0`;

describe("API Route Handlers Integration", () => {
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = "Password123!";
  let authToken = "";
  let recordId = 0;
  let sharedLinkToken = "";

  beforeAll(async () => {
    await ensureTablesExist();
  });

  it("POST /api/users/register should create a user and return 201", async () => {
    const req = new NextRequest("http://localhost:3000/api/users/register", {
      method: "POST",
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        display_name: "Test User",
        gender: "male",
        birthday: "1990-01-01",
        height_cm: 180,
        target_weight_kg: 75,
        preferred_language: "en",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await registerHandler(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.email).toBe(testEmail);
    expect(data.display_name).toBe("Test User");
    expect(data.email_confirmed).toBe(false);
    expect(data.profile_image_url).toBeNull();
  });

  it("POST /api/users/register with multipart/form-data and avatar should save profile picture", async () => {
    const avatarEmail = `avatar_${Date.now()}@example.com`;
    const formData = new FormData();
    formData.append("email", avatarEmail);
    formData.append("password", testPassword);
    formData.append("display_name", "Avatar User");
    formData.append("gender", "female");
    formData.append("birthday", "1995-05-15");
    formData.append("height_cm", "165");
    formData.append("target_weight_kg", "60");
    formData.append("preferred_language", "pt");

    const sampleBlob = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], { type: "image/jpeg" });
    formData.append("file", sampleBlob, "avatar.jpg");

    const req = new NextRequest("http://localhost:3000/api/users/register", {
      method: "POST",
      body: formData,
    });

    const res = await registerHandler(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.email).toBe(avatarEmail);
    expect(data.profile_image_url).toBeDefined();
    expect(data.profile_image_url).toMatch(/^\/uploads\/profile_pics\/user_\d+_[a-f0-9]+\.jpg$/);
  });

  it("POST /api/users/login before confirmation should return 403 EMAIL_NOT_CONFIRMED", async () => {
    const req = new NextRequest("http://localhost:3000/api/users/login", {
      method: "POST",
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.detail).toBe("EMAIL_NOT_CONFIRMED");
  });

  it("POST /api/users/login after confirming email should return access token", async () => {
    await db
      .update(users)
      .set({ emailConfirmed: true })
      .where(eq(users.email, testEmail));

    const req = new NextRequest("http://localhost:3000/api/users/login", {
      method: "POST",
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.access_token).toBeDefined();
    expect(data.token_type).toBe("bearer");
    authToken = data.access_token;
  });

  it("GET /api/users/me with valid Bearer token should return user profile", async () => {
    const req = new NextRequest("http://localhost:3000/api/users/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const res = await meHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.email).toBe(testEmail);
    expect(data.display_name).toBe("Test User");
  });

  it("PUT /api/users/profile should update profile fields", async () => {
    const req = new NextRequest("http://localhost:3000/api/users/profile", {
      method: "PUT",
      body: JSON.stringify({
        display_name: "Updated Name",
        target_weight_kg: 72,
      }),
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    const res = await updateProfileHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.display_name).toBe("Updated Name");
    expect(data.target_weight_kg).toBe(72);
  });

  it("POST /api/records/upload should parse spreadsheet and insert records", async () => {
    const data = [
      {
        "Hora/Data": "06:37 20/03/2026",
        "Peso(kg)": "75.0",
        "IMC": "23.5",
        "Gordura Corporal(%)": "18.0",
        "Gordura Subcutânea(%)": "15.0",
        "Gordura Visceral": "7",
        "Água Corporal(%)": "58.0",
        "Massa Musc. Esquelética(%)": "45.0",
        "Massa Muscular(kg)": "58.0",
        "Massa Óssea(kg)": "3.2",
        "Proteína(%)": "18.5",
        "TMB(kcal)": "1650",
        "Idade Metabólica": "28",
        "Massa Gorda(kg)": "13.5",
        "Teor de Umidade(kg)": "43.5",
        "Músculo Esquelético(kg)": "33.8",
        "Taxa Muscular(%)": "77.3",
        "Massa Protéica(kg)": "13.9",
        "Obesidade(%)": "0",
        "Massa Livre de Gordura(kg)": "61.5",
        "SMI(kg/m²)": "8.2",
        "Pontuação Corporal": "85",
        "Peso-alvo(kg)": "72.0",
        "Controle de Peso(kg)": "-3.0",
        "Controle de Gordura(kg)": "-2.0",
        "Controle Muscular(kg)": "1.0",
      },
      {
        "Hora/Data": "07:15 25/03/2026",
        "Peso(kg)": "74.0",
        "IMC": "23.1",
        "Gordura Corporal(%)": "17.0",
        "Gordura Subcutânea(%)": "14.2",
        "Gordura Visceral": "6",
        "Água Corporal(%)": "59.0",
        "Massa Musc. Esquelética(%)": "46.0",
        "Massa Muscular(kg)": "58.5",
        "Massa Óssea(kg)": "3.2",
        "Proteína(%)": "19.0",
        "TMB(kcal)": "1660",
        "Idade Metabólica": "27",
        "Massa Gorda(kg)": "12.6",
        "Teor de Umidade(kg)": "43.7",
        "Músculo Esquelético(kg)": "34.0",
        "Taxa Muscular(%)": "79.1",
        "Massa Protéica(kg)": "14.1",
        "Obesidade(%)": "0",
        "Massa Livre de Gordura(kg)": "61.4",
        "SMI(kg/m²)": "8.3",
        "Pontuação Corporal": "88",
        "Peso-alvo(kg)": "72.0",
        "Controle de Peso(kg)": "-2.0",
        "Controle de Gordura(kg)": "-1.5",
        "Controle Muscular(kg)": "0.5",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const formData = new FormData();
    const file = new File([buf], "fitdays_export.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    formData.append("file", file);

    const req = new NextRequest("http://localhost:3000/api/records/upload", {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    const res = await uploadRecordsHandler(req);
    const result = await res.json();
    expect(res.status).toBe(201);
    expect(result.inserted).toBe(2);
    expect(result.total_processed).toBe(2);
  });

  it("GET /api/records should return parsed records", async () => {
    const req = new NextRequest("http://localhost:3000/api/records", {
      method: "GET",
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const res = await getRecordsHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(2);
    expect(data[0].weight).toBe(75.0);
    expect(data[1].weight).toBe(74.0);
    recordId = data[0].id;
  });

  it("GET /api/records/summary should compute weight and body fat differences", async () => {
    const req = new NextRequest("http://localhost:3000/api/records/summary", {
      method: "GET",
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const res = await getSummaryHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.total_records).toBe(2);
    expect(data.starting_weight).toBe(75.0);
    expect(data.current_weight).toBe(74.0);
    expect(data.weight_change).toBe(-1.0);
    expect(data.weight_history.length).toBe(2);
  });

  it("POST & GET /api/records/[id]/report should attach and fetch a report PDF", async () => {
    const formData = new FormData();
    const dummyPdf = new File(["%PDF-1.4 dummy pdf content"], "report.pdf", { type: "application/pdf" });
    formData.append("file", dummyPdf);

    const uploadReq = new NextRequest(`http://localhost:3000/api/records/${recordId}/report`, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    const uploadRes = await uploadReportHandler(uploadReq, { params: Promise.resolve({ id: String(recordId) }) });
    const reportData = await uploadRes.json();
    expect(uploadRes.status).toBe(201);
    expect(reportData.record_id).toBe(recordId);
    expect(reportData.mime_type).toBe("application/pdf");

    const getReq = new NextRequest(`http://localhost:3000/api/records/${recordId}/report`, {
      method: "GET",
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const getRes = await getReportHandler(getReq, { params: Promise.resolve({ id: String(recordId) }) });
    expect(getRes.status).toBe(200);
    const fetchedData = await getRes.json();
    expect(fetchedData.id).toBe(reportData.id);
  });

  it("POST /api/shared-links should create a protected shared link", async () => {
    const req = new NextRequest("http://localhost:3000/api/shared-links", {
      method: "POST",
      body: JSON.stringify({
        description: "Shared for Doctor",
        entry_ids: [recordId],
        password: "guestPassword123",
        include_attachments: true,
      }),
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    const res = await createSharedLinkHandler(req);
    expect(res.status).toBe(201);
    const linkData = await res.json();
    expect(linkData.token).toBeDefined();
    expect(linkData.has_password).toBe(true);
    expect(linkData.entry_count).toBe(1);
    sharedLinkToken = linkData.token;
  });

  it("GET /api/shared-links/public/[token] should return public metadata", async () => {
    const req = new NextRequest(`http://localhost:3000/api/shared-links/public/${sharedLinkToken}`, {
      method: "GET",
    });

    const res = await getPublicLinkHandler(req, { params: Promise.resolve({ token: sharedLinkToken }) });
    expect(res.status).toBe(200);
    const meta = await res.json();
    expect(meta.description).toBe("Shared for Doctor");
    expect(meta.has_password).toBe(true);
  });

  it("POST /api/shared-links/public/[token]/verify should return guest token for correct password", async () => {
    const req = new NextRequest(`http://localhost:3000/api/shared-links/public/${sharedLinkToken}/verify`, {
      method: "POST",
      body: JSON.stringify({ password: "guestPassword123" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await verifyPublicLinkHandler(req, { params: Promise.resolve({ token: sharedLinkToken }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.guest_token).toBeDefined();

    // Now test accessing public data with guest token
    const dataReq = new NextRequest(`http://localhost:3000/api/shared-links/public/${sharedLinkToken}/data`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${data.guest_token}`,
      },
    });

    const dataRes = await getPublicDataHandler(dataReq, { params: Promise.resolve({ token: sharedLinkToken }) });
    expect(dataRes.status).toBe(200);
    const publicData = await dataRes.json();
    expect(publicData.dashboard.total_records).toBe(1);
    expect(publicData.entries.length).toBe(1);
    expect(publicData.entries[0].report.url).toContain(`/api/shared-links/public/${sharedLinkToken}/attachments/`);
  });

  it("POST /api/users/change-password should update password", async () => {
    const req = new NextRequest("http://localhost:3000/api/users/change-password", {
      method: "POST",
      body: JSON.stringify({
        current_password: testPassword,
        new_password: "NewPassword456!",
      }),
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    const res = await changePasswordHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message).toBe("Password changed successfully");
  });

  it("POST /api/records/delete should remove records", async () => {
    const req = new NextRequest("http://localhost:3000/api/records/delete", {
      method: "POST",
      body: JSON.stringify({ ids: [recordId] }),
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    const res = await deleteRecordsHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.deleted).toContain(recordId);
  });
});
