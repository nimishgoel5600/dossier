-- CreateEnum
CREATE TYPE "HeaderStyle" AS ENUM ('PLAIN', 'BANNER');

-- CreateEnum
CREATE TYPE "SidebarStyle" AS ENUM ('PLAIN', 'TINTED');

-- CreateEnum
CREATE TYPE "DateStyle" AS ENUM ('INLINE', 'TIMELINE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "HeadingStyle" ADD VALUE 'BAR';
ALTER TYPE "HeadingStyle" ADD VALUE 'BAND';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ThemeFont" ADD VALUE 'SOURCE_SERIF';
ALTER TYPE "ThemeFont" ADD VALUE 'LORA';
ALTER TYPE "ThemeFont" ADD VALUE 'LIBRE_CASLON';
ALTER TYPE "ThemeFont" ADD VALUE 'PLAYFAIR';
ALTER TYPE "ThemeFont" ADD VALUE 'FRAUNCES';
ALTER TYPE "ThemeFont" ADD VALUE 'INTER';
ALTER TYPE "ThemeFont" ADD VALUE 'MANROPE';
ALTER TYPE "ThemeFont" ADD VALUE 'WORK_SANS';
ALTER TYPE "ThemeFont" ADD VALUE 'SPACE_GROTESK';
ALTER TYPE "ThemeFont" ADD VALUE 'JETBRAINS_MONO';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ThemeLayout" ADD VALUE 'SIDE_HEADINGS';
ALTER TYPE "ThemeLayout" ADD VALUE 'SPLIT_END';

-- AlterTable
ALTER TABLE "Theme" ADD COLUMN     "dateStyle" "DateStyle" NOT NULL DEFAULT 'INLINE',
ADD COLUMN     "headerStyle" "HeaderStyle" NOT NULL DEFAULT 'PLAIN',
ADD COLUMN     "sidebarStyle" "SidebarStyle" NOT NULL DEFAULT 'PLAIN';
