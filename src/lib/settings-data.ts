import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { DEFAULT_BASE_THEME, settingsFromRows, settingValue, type SettingsData } from "@/lib/settings";

/**
 * The settings in effect. Nothing in the database ties the base theme
 * setting to its theme, so a deleted custom theme reads as Editorial here.
 */
export async function loadSettings(): Promise<SettingsData> {
  const settings = settingsFromRows(await prisma.setting.findMany());
  if (settings.baseThemeId !== DEFAULT_BASE_THEME) {
    const theme = await prisma.theme.findUnique({ where: { id: settings.baseThemeId }, select: { id: true } });
    if (!theme) return { ...settings, baseThemeId: DEFAULT_BASE_THEME };
  }
  return settings;
}

/**
 * Saves the given settings together; null removes one, so it reads as not
 * set. Pass a transaction client to save them as part of that transaction.
 */
export async function saveSettings(changes: Partial<SettingsData>, db?: Prisma.TransactionClient): Promise<void> {
  if (!db) return prisma.$transaction((tx) => saveSettings(changes, tx));
  for (const [key, change] of Object.entries(changes)) {
    if (change === undefined) continue;
    const value = settingValue(change);
    if (value === null) await db.setting.deleteMany({ where: { key } });
    else await db.setting.upsert({ where: { key }, create: { key, value }, update: { value } });
  }
}
