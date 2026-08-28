-- CreateTable
CREATE TABLE "issue_reactions" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "issue_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "emoji" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "issue_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "issue_reactions_issue_id_user_id_emoji_key" ON "issue_reactions"("issue_id", "user_id", "emoji");

-- CreateIndex
CREATE INDEX "issue_reactions_organization_id_issue_id_idx" ON "issue_reactions"("organization_id", "issue_id");

-- AddForeignKey
ALTER TABLE "issue_reactions" ADD CONSTRAINT "issue_reactions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue_reactions" ADD CONSTRAINT "issue_reactions_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue_reactions" ADD CONSTRAINT "issue_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
