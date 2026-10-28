-- CreateEnum
CREATE TYPE "ThemeFont" AS ENUM ('NEWSREADER', 'GARAMOND', 'GEIST', 'PLEX_SANS', 'PLEX_MONO');

-- CreateEnum
CREATE TYPE "ThemeLayout" AS ENUM ('SINGLE', 'SPLIT');

-- CreateEnum
CREATE TYPE "ThemeAlign" AS ENUM ('LEFT', 'CENTER');

-- CreateEnum
CREATE TYPE "HeadingStyle" AS ENUM ('RULE', 'CAPS', 'PLAIN');

-- CreateEnum
CREATE TYPE "Density" AS ENUM ('COMPACT', 'REGULAR', 'AIRY');

-- CreateEnum
CREATE TYPE "AiProvider" AS ENUM ('LOCAL', 'OPENAI', 'ANTHROPIC');

-- CreateEnum
CREATE TYPE "Creativity" AS ENUM ('FAITHFUL', 'BALANCED', 'EXPRESSIVE');

-- CreateEnum
CREATE TYPE "PaperSize" AS ENUM ('A4', 'LETTER');

-- CreateEnum
CREATE TYPE "DateFormat" AS ENUM ('DAY_MONTH_YEAR', 'MONTH_DAY_YEAR', 'NUMERIC');

-- CreateEnum
CREATE TYPE "Tone" AS ENUM ('WARM', 'DIRECT', 'FORMAL');

-- CreateTable
CREATE TABLE "Theme" (
    "id" TEXT NOT NULL,
    "builtIn" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT NOT NULL,
    "headFont" "ThemeFont" NOT NULL,
    "bodyFont" "ThemeFont" NOT NULL,
    "accent" TEXT NOT NULL,
    "layout" "ThemeLayout" NOT NULL DEFAULT 'SINGLE',
    "align" "ThemeAlign" NOT NULL DEFAULT 'LEFT',
    "headingStyle" "HeadingStyle" NOT NULL DEFAULT 'PLAIN',
    "density" "Density" NOT NULL DEFAULT 'REGULAR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Theme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "provider" "AiProvider",
    "baseUrl" TEXT,
    "model" TEXT,
    "apiKeyEnc" TEXT,
    "creativity" "Creativity" NOT NULL DEFAULT 'BALANCED',
    "strict" BOOLEAN NOT NULL DEFAULT true,
    "showDiff" BOOLEAN NOT NULL DEFAULT true,
    "paper" "PaperSize" NOT NULL DEFAULT 'A4',
    "dateFormat" "DateFormat" NOT NULL DEFAULT 'DAY_MONTH_YEAR',
    "defaultTone" "Tone" NOT NULL DEFAULT 'WARM',
    "docLanguage" TEXT,
    "customLanguages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fileNamePattern" TEXT NOT NULL DEFAULT '{name} – {company} – {doc}',
    "includeRefs" BOOLEAN NOT NULL DEFAULT false,
    "onePage" BOOLEAN NOT NULL DEFAULT true,
    "nightlyBackup" BOOLEAN NOT NULL DEFAULT true,
    "baseThemeId" TEXT NOT NULL DEFAULT 'editorial',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_baseThemeId_fkey" FOREIGN KEY ("baseThemeId") REFERENCES "Theme"("id") ON DELETE SET DEFAULT ON UPDATE CASCADE;

-- Built-in themes can't be deleted: Settings.baseThemeId falls back to
-- "editorial", which must always exist. (Added by hand: Prisma doesn't manage
-- triggers. TRUNCATE doesn't fire it, so tests can still empty the table.)
CREATE FUNCTION prevent_builtin_theme_delete() RETURNS trigger AS $$
BEGIN
  IF OLD."builtIn" THEN
    RAISE EXCEPTION 'Built-in theme "%" can''t be deleted.', OLD."name"
      USING ERRCODE = 'restrict_violation';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "Theme_prevent_builtin_delete"
  BEFORE DELETE ON "Theme"
  FOR EACH ROW EXECUTE FUNCTION prevent_builtin_theme_delete();
