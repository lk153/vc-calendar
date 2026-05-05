import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const adminPass = await bcrypt.hash("admin123!", 12);
  await db.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      username: "admin",
      name: "Admin",
      passwordHash: adminPass,
      role: "ADMIN",
      timezone: "Asia/Ho_Chi_Minh",
    },
  });

  const userPass = await bcrypt.hash("user123!", 12);
  await db.user.upsert({
    where: { email: "user@example.com" },
    update: {},
    create: {
      email: "user@example.com",
      username: "user",
      name: "Demo User",
      passwordHash: userPass,
      role: "USER",
      timezone: "Asia/Ho_Chi_Minh",
    },
  });

  await db.location.createMany({
    skipDuplicates: true,
    data: [
      { id: "loc-board-a", name: "Boardroom A", address: "Level 4, North Wing", floor: "Floor 12", capacity: 12, amenities: ["Video", "Projector", "Whiteboard"] },
      { id: "loc-huddle-1", name: "Huddle 1", address: "Engineering Wing", floor: "Floor 4", capacity: 6, amenities: ["Video"] },
      { id: "loc-huddle-2", name: "Huddle 2", address: "Engineering Wing", floor: "Floor 4", capacity: 4, amenities: [] },
      { id: "loc-focus-a", name: "Focus A", address: "Sales Floor", floor: "Floor 3", capacity: 1, amenities: [] },
    ],
  });
}

main().finally(() => db.$disconnect());
