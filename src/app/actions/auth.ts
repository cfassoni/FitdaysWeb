"use server";

import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword, createSession, deleteSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) return { error: "Email e senha são obrigatórios" };

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!user || !(await verifyPassword(password, user.hashedPassword))) {
    return { error: "Credenciais inválidas" };
  }

  await createSession(user.id, user.email);
  redirect("/");
}

export async function register(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const displayName = formData.get("displayName") as string;

  if (!email || !password) return { error: "Email e senha são obrigatórios" };

  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    return { error: "Email já cadastrado" };
  }

  const hashedPassword = await hashPassword(password);
  
  const [newUser] = await db.insert(users).values({
    email,
    hashedPassword,
    displayName: displayName || email.split("@")[0],
    emailConfirmed: false,
  }).returning();

  await createSession(newUser.id, newUser.email);
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
