-- CreateTable
CREATE TABLE "key_stores" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "primary_key" TEXT NOT NULL,
    "secondary_key" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "key_stores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "key_stores_user_id_idx" ON "key_stores"("user_id");

-- CreateIndex
CREATE INDEX "key_stores_user_id_primary_key_status_idx" ON "key_stores"("user_id", "primary_key", "status");

-- CreateIndex
CREATE INDEX "key_stores_user_id_primary_key_secondary_key_idx" ON "key_stores"("user_id", "primary_key", "secondary_key");

-- AddForeignKey
ALTER TABLE "key_stores" ADD CONSTRAINT "key_stores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
