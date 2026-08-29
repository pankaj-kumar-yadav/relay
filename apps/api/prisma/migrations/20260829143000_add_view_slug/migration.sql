-- AlterTable
ALTER TABLE "views" ADD COLUMN "slug" TEXT;

-- Backfill kebab-case slugs from names; suffix on per-org collisions
WITH numbered AS (
  SELECT
    id,
    COALESCE(
      NULLIF(
        trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')),
        ''
      ),
      'view'
    ) AS base_slug,
    ROW_NUMBER() OVER (
      PARTITION BY organization_id,
        COALESCE(
          NULLIF(
            trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')),
            ''
          ),
          'view'
        )
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM "views"
)
UPDATE "views" AS v
SET "slug" = CASE
  WHEN n.rn = 1 THEN n.base_slug
  ELSE n.base_slug || '-' || n.rn::text
END
FROM numbered n
WHERE v.id = n.id;

-- AlterTable
ALTER TABLE "views" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "views_organization_id_slug_key" ON "views"("organization_id", "slug");
