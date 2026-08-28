-- CreateTable
CREATE TABLE "cycles" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "team_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cycles_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "issues" ADD COLUMN "cycle_id" UUID;

-- CreateIndex
CREATE INDEX "cycles_organization_id_idx" ON "cycles"("organization_id");

-- CreateIndex
CREATE INDEX "cycles_team_id_starts_at_idx" ON "cycles"("team_id", "starts_at");

-- CreateIndex
CREATE INDEX "cycles_team_id_status_idx" ON "cycles"("team_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "cycles_one_active_per_team" ON "cycles"("team_id") WHERE "status" = 'active';

-- CreateIndex
CREATE INDEX "issues_cycle_id_idx" ON "issues"("cycle_id");

-- AddForeignKey
ALTER TABLE "cycles" ADD CONSTRAINT "cycles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycles" ADD CONSTRAINT "cycles_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "cycles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
