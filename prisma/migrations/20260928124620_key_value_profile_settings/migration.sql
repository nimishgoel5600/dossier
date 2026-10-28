-- CreateTable
CREATE TABLE "ProfileField" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileField_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- Keep the saved settings, written as src/lib/settings.ts reads them: enums
-- by name, flags as "true"/"false", lists as JSON; null means not set (no
-- row). (Added by hand.) The profile's basics are not copied (decided
-- 28 September 2026).
INSERT INTO "Setting" ("key", "value", "updatedAt")
SELECT entry.key, entry.value, CURRENT_TIMESTAMP
FROM "Settings",
LATERAL (VALUES
    ('provider', "provider"::TEXT),
    ('baseUrl', "baseUrl"),
    ('model', "model"),
    ('apiKeyEnc', "apiKeyEnc"),
    ('creativity', "creativity"::TEXT),
    ('strict', "strict"::TEXT),
    ('showDiff', "showDiff"::TEXT),
    ('paper', "paper"::TEXT),
    ('dateFormat', "dateFormat"::TEXT),
    ('defaultTone', "defaultTone"::TEXT),
    ('docLanguage', "docLanguage"),
    ('customLanguages', to_jsonb(COALESCE("customLanguages", ARRAY[]::TEXT[]))::TEXT),
    ('fileNamePattern', "fileNamePattern"),
    ('includeRefs', "includeRefs"::TEXT),
    ('onePage', "onePage"::TEXT),
    ('nightlyBackup', "nightlyBackup"::TEXT),
    ('baseThemeId', "baseThemeId")
) AS entry("key", "value")
WHERE "Settings"."id" = 1 AND entry.value IS NOT NULL;

-- DropForeignKey
ALTER TABLE "Settings" DROP CONSTRAINT "Settings_baseThemeId_fkey";

-- DropTable
DROP TABLE "Profile";

-- DropTable
DROP TABLE "Settings";
