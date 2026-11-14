import { NextResponse } from "next/server";
import { requireUser } from "@/server/auth/get-user";
import { getUserProfile } from "@/server/services/user.service";
import { createDatabaseBackup, listBackups, verifyBackupIntegrity } from "@/server/services/backup.service";
import { handleApiError } from "@/server/auth/api-error";
import { ForbiddenError } from "@/lib/errors/app-error";

async function verifyAdminRole(userId: string) {
  const profile = await getUserProfile(userId);
  if (profile.role !== "admin" && profile.role !== "owner") {
    throw new ForbiddenError("Administrative privileges required to access database backups");
  }
}

export async function GET() {
  try {
    const user = await requireUser();
    await verifyAdminRole(user.id);

    const backups = listBackups();
    return NextResponse.json({
      data: backups,
      totalCount: backups.length,
    });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

export async function POST() {
  try {
    const user = await requireUser();
    await verifyAdminRole(user.id);

    const metadata = await createDatabaseBackup();
    const verification = verifyBackupIntegrity(metadata.fileName);

    return NextResponse.json(
      {
        data: {
          backup: metadata,
          verification,
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
