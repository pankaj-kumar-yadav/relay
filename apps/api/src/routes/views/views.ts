import { Prisma } from '@prisma/client';
import { Router } from 'express';

import { HttpStatus } from '@/constants/http.js';
import { prisma } from '@/db.js';
import { requireAuth } from '@/middleware/auth/requireAuth.js';
import { requireOrgMember } from '@/middleware/org/requireOrgMember.js';
import {
  createViewBodySchema,
  patchViewBodySchema,
  viewFiltersSchema,
  type ViewFilters,
} from '@/routes/views/views.schema.js';
import {
  ForbiddenError,
  NotFoundError,
  sendError,
  ValidationError,
} from '@/utils/errors.js';
import { sendSuccess } from '@/utils/response.js';
import { allocateViewSlug, slugifyViewName } from '@/utils/view/viewSlug.js';

export const viewsRouter: Router = Router({ mergeParams: true });

viewsRouter.use(requireAuth, requireOrgMember);

const viewSelect = {
  id: true,
  slug: true,
  name: true,
  filters: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
  owner: { select: { id: true, name: true } },
} satisfies Prisma.ViewSelect;

type ViewRow = Prisma.ViewGetPayload<{ select: typeof viewSelect }>;

function parseStoredFilters(raw: Prisma.JsonValue): ViewFilters {
  const parsed = viewFiltersSchema.safeParse(raw ?? {});
  return parsed.success ? parsed.data : {};
}

function asJson(filters: ViewFilters): Prisma.InputJsonValue {
  return { ...filters };
}

function publicView(view: ViewRow) {
  return {
    id: view.id,
    slug: view.slug,
    name: view.name,
    filters: parseStoredFilters(view.filters),
    ownerId: view.ownerId,
    owner: { id: view.owner.id, name: view.owner.name },
    createdAt: view.createdAt.toISOString(),
    updatedAt: view.updatedAt.toISOString(),
  };
}

async function findView(organizationId: string, viewSlug: string) {
  return prisma.view.findFirst({
    where: { organizationId, slug: viewSlug },
    select: viewSelect,
  });
}

async function uniqueViewSlug(organizationId: string, name: string) {
  const existing = await prisma.view.findMany({
    where: { organizationId },
    select: { slug: true },
  });
  return allocateViewSlug(
    slugifyViewName(name),
    new Set(existing.map((row) => row.slug)),
  );
}

function assertOwner(view: ViewRow, userId: string) {
  if (view.ownerId !== userId) {
    throw new ForbiddenError('Only the owner can change this view');
  }
}

viewsRouter.get('/', async (req, res) => {
  try {
    const views = await prisma.view.findMany({
      where: { organizationId: req.org!.id },
      orderBy: { updatedAt: 'desc' },
      select: viewSelect,
    });
    sendSuccess(res, { data: { views: views.map(publicView) } });
  } catch (err) {
    sendError(res, err);
  }
});

viewsRouter.post('/', async (req, res) => {
  try {
    const parsed = createViewBodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid input');
    }

    const filters = parsed.data.filters ?? {};
    const slug = await uniqueViewSlug(req.org!.id, parsed.data.name);
    const view = await prisma.view.create({
      data: {
        organizationId: req.org!.id,
        ownerId: req.user!.id,
        name: parsed.data.name,
        slug,
        filters: asJson(filters),
      },
      select: viewSelect,
    });
    sendSuccess(res, {
      status: HttpStatus.CREATED,
      message: 'View created',
      data: { view: publicView(view) },
    });
  } catch (err) {
    sendError(res, err);
  }
});

viewsRouter.get('/:viewId', async (req, res) => {
  try {
    const view = await findView(req.org!.id, String(req.params.viewId));
    if (!view) {
      throw new NotFoundError('View not found');
    }
    sendSuccess(res, { data: { view: publicView(view) } });
  } catch (err) {
    sendError(res, err);
  }
});

viewsRouter.patch('/:viewId', async (req, res) => {
  try {
    const parsed = patchViewBodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid input');
    }
    if (parsed.data.name === undefined && parsed.data.filters === undefined) {
      throw new ValidationError('No fields to update');
    }

    const existing = await findView(req.org!.id, String(req.params.viewId));
    if (!existing) {
      throw new NotFoundError('View not found');
    }
    assertOwner(existing, req.user!.id);

    const view = await prisma.view.update({
      where: { id: existing.id },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.filters !== undefined ? { filters: asJson(parsed.data.filters) } : {}),
      },
      select: viewSelect,
    });
    sendSuccess(res, {
      message: 'View updated',
      data: { view: publicView(view) },
    });
  } catch (err) {
    sendError(res, err);
  }
});

viewsRouter.delete('/:viewId', async (req, res) => {
  try {
    const existing = await findView(req.org!.id, String(req.params.viewId));
    if (!existing) {
      throw new NotFoundError('View not found');
    }
    assertOwner(existing, req.user!.id);
    await prisma.view.delete({ where: { id: existing.id } });
    sendSuccess(res, {
      message: 'View deleted',
      data: { id: existing.id },
    });
  } catch (err) {
    sendError(res, err);
  }
});
