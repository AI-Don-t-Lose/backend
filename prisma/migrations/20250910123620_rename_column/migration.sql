/*
  Warnings:

  - You are about to drop the column `createdAt` on the `auth` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `auth` table. All the data in the column will be lost.
  - You are about to drop the column `externalId` on the `auth` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `auth` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `recommendations` table. All the data in the column will be lost.
  - You are about to drop the column `recommendedAt` on the `recommendations` table. All the data in the column will be lost.
  - You are about to drop the column `stockName` on the `recommendations` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `recommendations` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `recommendations` table. All the data in the column will be lost.
  - Added the required column `external_id` to the `auth` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `auth` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stock_name` to the `recommendations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `recommendations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `recommendations` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."recommendations" DROP CONSTRAINT "recommendations_userId_fkey";

-- AlterTable
ALTER TABLE "public"."auth" DROP COLUMN "createdAt",
DROP COLUMN "deletedAt",
DROP COLUMN "externalId",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMPTZ,
ADD COLUMN     "external_id" VARCHAR(255) NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."recommendations" DROP COLUMN "createdAt",
DROP COLUMN "recommendedAt",
DROP COLUMN "stockName",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "recommended_at" TIMESTAMPTZ,
ADD COLUMN     "stock_name" VARCHAR(255) NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "user_id" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."recommendations" ADD CONSTRAINT "recommendations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."auth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
