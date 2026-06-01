-- AlterEnum
ALTER TYPE "AuthProvider" ADD VALUE 'LOCAL';

-- AlterTable
ALTER TABLE "User" ADD COLUMN "password" TEXT;
