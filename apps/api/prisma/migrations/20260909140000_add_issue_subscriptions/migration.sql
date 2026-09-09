-- CreateTable
CREATE TABLE "issue_subscriptions" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "issue_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "issue_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "issue_subscriptions_organization_id_user_id_idx" ON "issue_subscriptions"("organization_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "issue_subscriptions_issue_id_user_id_key" ON "issue_subscriptions"("issue_id", "user_id");

-- AddForeignKey
ALTER TABLE "issue_subscriptions" ADD CONSTRAINT "issue_subscriptions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue_subscriptions" ADD CONSTRAINT "issue_subscriptions_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue_subscriptions" ADD CONSTRAINT "issue_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
