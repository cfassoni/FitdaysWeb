import { describe, it, expect, beforeAll } from "vitest";
import { NextRequest } from "next/server";
import * as XLSX from "xlsx";
import { ensureTablesExist } from "@/db/initDb";
import { POST as registerHandler } from "../../app/api/users/register/route";
import { POST as loginHandler } from "../../app/api/users/login/route";
import { POST as uploadRecordsHandler } from "../../app/api/records/upload/route";
import { GET as getRecordsHandler } from "../../app/api/records/route";
import { POST as starRecordHandler } from "../../app/api/records/[id]/star/route";
import {
  POST as createSharedLinkHandler,
} from "../../app/api/shared-links/route";
import {
  GET as getSharedLinkDetailsHandler,
  PATCH as updateSharedLinkHandler,
} from "../../app/api/shared-links/[id]/route";
import { GET as getPublicDataHandler } from "../../app/api/shared-links/public/[token]/data/route";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

describe("Starred History and Auto-Sharing Integration", () => {
  const userEmail = `star_test_${Date.now()}@example.com`;
  const userPassword = "Password123!";
  let authToken = "";
  let recordIds: number[] = [];
  let sharedLinkId = "";
  let sharedLinkToken = "";

  beforeAll(async () => {
    await ensureTablesExist();

    // Register user
    const regReq = new NextRequest("http://localhost:3000/api/users/register", {
      method: "POST",
      body: JSON.stringify({
        email: userEmail,
        password: userPassword,
        display_name: "Star Test User",
        gender: "male",
        birthday: "1990-01-01",
        height_cm: 180,
        target_weight_kg: 75,
        preferred_language: "en",
      }),
      headers: { "Content-Type": "application/json" },
    });
    const regRes = await registerHandler(regReq);
    expect(regRes.status).toBe(201);

    // Confirm email
    await db
      .update(users)
      .set({ emailConfirmed: true })
      .where(eq(users.email, userEmail));

    // Login
    const loginReq = new NextRequest("http://localhost:3000/api/users/login", {
      method: "POST",
      body: JSON.stringify({
        email: userEmail,
        password: userPassword,
      }),
      headers: { "Content-Type": "application/json" },
    });
    const loginRes = await loginHandler(loginReq);
    expect(loginRes.status).toBe(200);
    const loginData = await loginRes.json();
    authToken = loginData.access_token;

    // Upload records using XLSX
    const data = [
      {
        "Time of Measurement": "2026-09-01 07:00:00",
        "Weight(kg)": "75.0",
        "BMI": "23.5",
        "Body Fat(%)": "18.0",
        "Subcutaneous Fat(%)": "15.0",
        "Visceral Fat": "7",
        "Body Water(%)": "58.0",
        "Skeletal Muscle(%)": "45.0",
        "Muscle Mass(kg)": "58.0",
        "Bone Mass(kg)": "3.2",
        "Protein(%)": "18.5",
        "BMR(kcal)": "1650",
        "Metabolic Age": "28",
        "Fat Mass(kg)": "13.5",
        "Water Content(kg)": "43.5",
        "Skeletal Muscle Mass(kg)": "33.8",
        "Muscle Rate(%)": "77.3",
        "Protein Mass(kg)": "13.9",
        "Obesity Level": "0",
        "Fat-free Weight(kg)": "61.5",
        "Body Score": "85",
        "Target Weight(kg)": "72.0",
        "Weight Control(kg)": "-3.0",
        "Fat Control(kg)": "-2.0",
        "Muscle Control(kg)": "1.0",
      },
      {
        "Time of Measurement": "2026-09-02 07:00:00",
        "Weight(kg)": "74.5",
        "BMI": "23.3",
        "Body Fat(%)": "17.8",
        "Subcutaneous Fat(%)": "14.8",
        "Visceral Fat": "7",
        "Body Water(%)": "58.2",
        "Skeletal Muscle(%)": "45.2",
        "Muscle Mass(kg)": "58.2",
        "Bone Mass(kg)": "3.2",
        "Protein(%)": "18.6",
        "BMR(kcal)": "1655",
        "Metabolic Age": "28",
        "Fat Mass(kg)": "13.2",
        "Water Content(kg)": "43.6",
        "Skeletal Muscle Mass(kg)": "33.9",
        "Muscle Rate(%)": "77.5",
        "Protein Mass(kg)": "14.0",
        "Obesity Level": "0",
        "Fat-free Weight(kg)": "61.6",
        "Body Score": "86",
        "Target Weight(kg)": "72.0",
        "Weight Control(kg)": "-2.5",
        "Fat Control(kg)": "-1.8",
        "Muscle Control(kg)": "0.7",
      },
      {
        "Time of Measurement": "2026-09-03 07:00:00",
        "Weight(kg)": "74.0",
        "BMI": "23.1",
        "Body Fat(%)": "17.5",
        "Subcutaneous Fat(%)": "14.5",
        "Visceral Fat": "6",
        "Body Water(%)": "58.5",
        "Skeletal Muscle(%)": "45.5",
        "Muscle Mass(kg)": "58.5",
        "Bone Mass(kg)": "3.2",
        "Protein(%)": "18.8",
        "BMR(kcal)": "1660",
        "Metabolic Age": "27",
        "Fat Mass(kg)": "12.9",
        "Water Content(kg)": "43.8",
        "Skeletal Muscle Mass(kg)": "34.0",
        "Muscle Rate(%)": "77.8",
        "Protein Mass(kg)": "14.1",
        "Obesity Level": "0",
        "Fat-free Weight(kg)": "61.8",
        "Body Score": "87",
        "Target Weight(kg)": "72.0",
        "Weight Control(kg)": "-2.0",
        "Fat Control(kg)": "-1.5",
        "Muscle Control(kg)": "0.5",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const formData = new FormData();
    const file = new File([buf], "recomp_export.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    formData.append("file", file);

    const uploadReq = new NextRequest("http://localhost:3000/api/records/upload", {
      method: "POST",
      body: formData,
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const uploadRes = await uploadRecordsHandler(uploadReq);
    expect(uploadRes.status).toBe(201);

    // Fetch records
    const listReq = new NextRequest("http://localhost:3000/api/records", {
      method: "GET",
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const listRes = await getRecordsHandler(listReq);
    expect(listRes.status).toBe(200);
    const records = await listRes.json();
    expect(records.length).toBe(3);
    recordIds = records.map((r: { id: number }) => r.id);
  });

  it("should initialize records with starred: false", async () => {
    const req = new NextRequest("http://localhost:3000/api/records", {
      method: "GET",
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const res = await getRecordsHandler(req);
    const data = await res.json();
    expect(data[0].starred).toBe(false);
    expect(data[1].starred).toBe(false);
    expect(data[2].starred).toBe(false);
  });

  it("POST /api/records/[id]/star should toggle starred status to true and then false", async () => {
    const targetId = recordIds[0];

    // Toggle to true
    const starReq = new NextRequest(`http://localhost:3000/api/records/${targetId}/star`, {
      method: "POST",
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const starRes = await starRecordHandler(starReq, { params: { id: String(targetId) } });
    expect(starRes.status).toBe(200);
    const starData = await starRes.json();
    expect(starData.success).toBe(true);
    expect(starData.starred).toBe(true);

    // Verify in GET /api/records
    const listReq = new NextRequest("http://localhost:3000/api/records", {
      method: "GET",
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const listRes = await getRecordsHandler(listReq);
    const records = await listRes.json();
    const updated = records.find((r: { id: number }) => r.id === targetId);
    expect(updated.starred).toBe(true);

    // Toggle back to false
    const unstarReq = new NextRequest(`http://localhost:3000/api/records/${targetId}/star`, {
      method: "POST",
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const unstarRes = await starRecordHandler(unstarReq, { params: { id: String(targetId) } });
    expect(unstarRes.status).toBe(200);
    const unstarData = await unstarRes.json();
    expect(unstarData.starred).toBe(false);
  });

  it("POST /api/shared-links with auto_share_starred: true creates link with initial manual records", async () => {
    // We select only recordIds[0] manually, auto_share_starred: true
    const createReq = new NextRequest("http://localhost:3000/api/shared-links", {
      method: "POST",
      body: JSON.stringify({
        description: "Auto-share Starred Link",
        entry_ids: [recordIds[0]],
        auto_share_starred: true,
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });

    const createRes = await createSharedLinkHandler(createReq);
    expect(createRes.status).toBe(201);
    const linkData = await createRes.json();
    expect(linkData.auto_share_starred).toBe(true);
    expect(linkData.entry_count).toBe(1);
    sharedLinkId = linkData.id;
    sharedLinkToken = linkData.token;
  });

  it("Starring recordIds[1] automatically syncs into the active auto-share shared link", async () => {
    // Star recordIds[1]
    const starReq = new NextRequest(`http://localhost:3000/api/records/${recordIds[1]}/star`, {
      method: "POST",
      body: JSON.stringify({ starred: true }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });
    const starRes = await starRecordHandler(starReq, { params: { id: String(recordIds[1]) } });
    expect(starRes.status).toBe(200);

    // Check that the shared link details now reflect 2 entries
    const detailReq = new NextRequest(`http://localhost:3000/api/shared-links/${sharedLinkId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const detailRes = await getSharedLinkDetailsHandler(detailReq, { params: { id: sharedLinkId } });
    expect(detailRes.status).toBe(200);
    const detailData = await detailRes.json();
    expect(detailData.entry_count).toBe(2);
  });

  it("Unstarring recordIds[1] automatically removes it from the shared link, leaving manual recordIds[0]", async () => {
    // Unstar recordIds[1]
    const unstarReq = new NextRequest(`http://localhost:3000/api/records/${recordIds[1]}/star`, {
      method: "POST",
      body: JSON.stringify({ starred: false }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });
    const unstarRes = await starRecordHandler(unstarReq, { params: { id: String(recordIds[1]) } });
    expect(unstarRes.status).toBe(200);

    // Check that the shared link details now reflect back to 1 entry
    const detailReq = new NextRequest(`http://localhost:3000/api/shared-links/${sharedLinkId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const detailRes = await getSharedLinkDetailsHandler(detailReq, { params: { id: sharedLinkId } });
    expect(detailRes.status).toBe(200);
    const detailData = await detailRes.json();
    expect(detailData.entry_count).toBe(1);
  });

  it("PATCH /api/shared-links/[id] toggling auto_share_starred recalculates the snapshot immediately", async () => {
    // Star recordIds[2]
    const starReq = new NextRequest(`http://localhost:3000/api/records/${recordIds[2]}/star`, {
      method: "POST",
      body: JSON.stringify({ starred: true }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });
    await starRecordHandler(starReq, { params: { id: String(recordIds[2]) } });

    // Link currently has recordIds[0] (manual) and recordIds[2] (starred) => 2 entries
    const detailReq = new NextRequest(`http://localhost:3000/api/shared-links/${sharedLinkId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const detailRes = await getSharedLinkDetailsHandler(detailReq, { params: { id: sharedLinkId } });
    const detailData = await detailRes.json();
    expect(detailData.entry_count).toBe(2);

    // Disable auto_share_starred via PATCH
    const patchReq = new NextRequest(`http://localhost:3000/api/shared-links/${sharedLinkId}`, {
      method: "PATCH",
      body: JSON.stringify({ auto_share_starred: false }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });
    const patchRes = await updateSharedLinkHandler(patchReq, { params: { id: sharedLinkId } });
    expect(patchRes.status).toBe(200);
    const patchData = await patchRes.json();
    expect(patchData.auto_share_starred).toBe(false);
    // Entry count should now revert to only the manual entry (1)
    expect(patchData.entry_count).toBe(1);

    // Re-enable auto_share_starred via PATCH
    const patchReq2 = new NextRequest(`http://localhost:3000/api/shared-links/${sharedLinkId}`, {
      method: "PATCH",
      body: JSON.stringify({ auto_share_starred: true }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });
    const patchRes2 = await updateSharedLinkHandler(patchReq2, { params: { id: sharedLinkId } });
    expect(patchRes2.status).toBe(200);
    const patchData2 = await patchRes2.json();
    expect(patchData2.auto_share_starred).toBe(true);
    // Entry count should immediately re-incorporate starred recordIds[2] => 2 entries
    expect(patchData2.entry_count).toBe(2);
  });

  it("GET /api/shared-links/public/[token]/data should strip the starred field for guests", async () => {
    const publicReq = new NextRequest(`http://localhost:3000/api/shared-links/public/${sharedLinkToken}/data`, {
      method: "GET",
    });
    const publicRes = await getPublicDataHandler(publicReq, { params: { token: sharedLinkToken } });
    expect(publicRes.status).toBe(200);
    const publicData = await publicRes.json();
    expect(publicData.entries.length).toBe(2);

    for (const entry of publicData.entries) {
      expect(entry.starred).toBeUndefined();
    }
  });

  it("POST /api/shared-links should reject empty entry_ids when auto_share_starred is false", async () => {
    const emptyReq = new NextRequest("http://localhost:3000/api/shared-links", {
      method: "POST",
      body: JSON.stringify({
        description: "Empty Invalid Link",
        entry_ids: [],
        auto_share_starred: false,
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });
    const emptyRes = await createSharedLinkHandler(emptyReq);
    expect(emptyRes.status).toBe(400);
    const emptyData = await emptyRes.json();
    expect(emptyData.detail).toContain("Description and at least one entry_id are required");
  });

  it("POST /api/shared-links should allow empty entry_ids when auto_share_starred is true (Option A)", async () => {
    // Create link with empty entry_ids and auto_share_starred true
    const autoEmptyReq = new NextRequest("http://localhost:3000/api/shared-links", {
      method: "POST",
      body: JSON.stringify({
        description: "Auto-share only link",
        entry_ids: [],
        auto_share_starred: true,
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });
    const autoEmptyRes = await createSharedLinkHandler(autoEmptyReq);
    expect(autoEmptyRes.status).toBe(201);
    const autoEmptyData = await autoEmptyRes.json();
    expect(autoEmptyData.auto_share_starred).toBe(true);
    // User already has recordIds[2] starred from previous tests => entry_count is 1
    expect(autoEmptyData.entry_count).toBe(1);

    // Fetch public data for this link
    const publicReq = new NextRequest(`http://localhost:3000/api/shared-links/public/${autoEmptyData.token}/data`, {
      method: "GET",
    });
    const publicRes = await getPublicDataHandler(publicReq, { params: { token: autoEmptyData.token } });
    expect(publicRes.status).toBe(200);
    const publicData = await publicRes.json();
    expect(publicData.entries.length).toBe(1);
    expect(publicData.entries[0].id).toBe(recordIds[2]);
  });

  it("POST /api/shared-links should allow auto_share_starred link creation even with 0 starred scans (Option A)", async () => {
    // Register fresh user with 0 scans
    const emptyUserEmail = `empty_user_${Date.now()}@example.com`;
    const regReq = new NextRequest("http://localhost:3000/api/users/register", {
      method: "POST",
      body: JSON.stringify({
        email: emptyUserEmail,
        password: userPassword,
        display_name: "Empty User",
        gender: "female",
        birthday: "1995-05-05",
        height_cm: 165,
        target_weight_kg: 60,
        preferred_language: "en",
      }),
      headers: { "Content-Type": "application/json" },
    });
    const regRes = await registerHandler(regReq);
    expect(regRes.status).toBe(201);

    await db.update(users).set({ emailConfirmed: true }).where(eq(users.email, emptyUserEmail));

    const loginReq = new NextRequest("http://localhost:3000/api/users/login", {
      method: "POST",
      body: JSON.stringify({ email: emptyUserEmail, password: userPassword }),
      headers: { "Content-Type": "application/json" },
    });
    const loginRes = await loginHandler(loginReq);
    const loginData = await loginRes.json();
    const emptyUserToken = loginData.access_token;

    // Create auto-share link with 0 entries
    const createReq = new NextRequest("http://localhost:3000/api/shared-links", {
      method: "POST",
      body: JSON.stringify({
        description: "Zero records auto-share link",
        entry_ids: [],
        auto_share_starred: true,
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${emptyUserToken}`,
      },
    });
    const createRes = await createSharedLinkHandler(createReq);
    expect(createRes.status).toBe(201);
    const createData = await createRes.json();
    expect(createData.entry_count).toBe(0);
    expect(createData.auto_share_starred).toBe(true);

    // Verify public endpoint returns empty array without error
    const publicReq = new NextRequest(`http://localhost:3000/api/shared-links/public/${createData.token}/data`, {
      method: "GET",
    });
    const publicRes = await getPublicDataHandler(publicReq, { params: { token: createData.token } });
    expect(publicRes.status).toBe(200);
    const publicData = await publicRes.json();
    expect(publicData.entries.length).toBe(0);
    expect(publicData.dashboard.total_records).toBe(0);
  });
});
