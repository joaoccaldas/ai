"use server";

import { revalidatePath } from "next/cache";
import { requireStudio } from "@/lib/session";
import { prisma } from "@/lib/db";

const ALLOWED = new Set(["requested", "booked", "completed", "cancelled"]);

export async function setBookingStatus(formData: FormData) {
  const { studio } = await requireStudio();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!ALLOWED.has(status)) return;
  await prisma.booking.updateMany({ where: { id, studioId: studio.id }, data: { status } });
  revalidatePath("/app/bookings");
}

export async function toggleDeposit(formData: FormData) {
  const { studio } = await requireStudio();
  const id = String(formData.get("id") ?? "");
  const b = await prisma.booking.findFirst({ where: { id, studioId: studio.id } });
  if (!b) return;
  await prisma.booking.update({ where: { id: b.id }, data: { depositPaid: !b.depositPaid } });
  revalidatePath("/app/bookings");
}

export async function deleteBooking(formData: FormData) {
  const { studio } = await requireStudio();
  const id = String(formData.get("id") ?? "");
  await prisma.booking.deleteMany({ where: { id, studioId: studio.id } });
  revalidatePath("/app/bookings");
}
