-- CreateTable
CREATE TABLE "public"."Auth" (
    "id" TEXT NOT NULL,
    "sequence" SERIAL NOT NULL,
    "externalId" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "Auth_pkey" PRIMARY KEY ("id")
);
