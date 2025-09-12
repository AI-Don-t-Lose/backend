-- CreateTable
CREATE TABLE "public"."categories" (
    "id" UUID NOT NULL,
    "category_name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."stores" (
    "id" UUID NOT NULL,
    "store_name" VARCHAR(255) NOT NULL,
    "category_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."consumptions" (
    "id" UUID NOT NULL,
    "purchase_time" TIMESTAMPTZ NOT NULL,
    "amount" INTEGER NOT NULL,
    "store_id" UUID NOT NULL,
    "auth_id" UUID NOT NULL,

    CONSTRAINT "consumptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."stats" (
    "id" UUID NOT NULL,
    "auth_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "consumption_year_month" TIMESTAMPTZ NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stores_category_id_key" ON "public"."stores"("category_id");

-- AddForeignKey
ALTER TABLE "public"."stores" ADD CONSTRAINT "stores_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."consumptions" ADD CONSTRAINT "consumptions_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."consumptions" ADD CONSTRAINT "consumptions_auth_id_fkey" FOREIGN KEY ("auth_id") REFERENCES "public"."auth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stats" ADD CONSTRAINT "stats_auth_id_fkey" FOREIGN KEY ("auth_id") REFERENCES "public"."auth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stats" ADD CONSTRAINT "stats_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
