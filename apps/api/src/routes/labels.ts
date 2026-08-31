import { Prisma } from '@/generated/prisma/client.js';
import { Router } from 'express';

import { HttpStatus } from '@/constants/http.js';
import {
  DEFAULT_LABEL_COLOR,
  isLabelColor,
  LABEL_NAME_MAX,
} from '@/constants/label.constant.js';
import { OrgRole } from '@/constants/org.js';
import { prisma } from '@/db.js';
import { requireAuth } from '@/middleware/auth/requireAuth.js';
import { requireOrgMember } from '@/middleware/org/requireOrgMember.js';
import { requireOrgRole } from '@/middleware/org/requireOrgRole.js';
import { z } from '@/openapi/zod.js';
import { NotFoundError, sendError, ValidationError } from '@/utils/errors.js';
import { sendSuccess } from '@/utils/response.js';

export const labelsRouter: Router = Router({ mergeParams: true });

labelsRouter.use(requireAuth, requireOrgMember);

const labelSelect = {
  id: true,
  name: true,
  color: true,
  createdAt: true,
  _count: { select: { issueLabels: true } },
} satisfies Prisma.LabelSelect;

type LabelRow = Prisma.LabelGetPayload<{ select: typeof labelSelect }>;

function publicLabel(label: LabelRow) {
  return {
    id: label.id,
    name: label.name,
    color: label.color,
    createdAt: label.createdAt.toISOString(),
    issueCount: label._count.issueLabels,
  };
}

export const createLabelBodySchema = z.object({
  name: z.string().trim().min(1).max(LABEL_NAME_MAX),
  color: z.string().trim().optional(),
});

export const patchLabelBodySchema = z.object({
  name: z.string().trim().min(1).max(LABEL_NAME_MAX).optional(),
  color: z.string().trim().optional(),
});

function parseColor(raw: string | undefined, fallback = DEFAULT_LABEL_COLOR): string {
  const color = raw ?? fallback;
  if (!isLabelColor(color)) {
    throw new ValidationError('Color must be a hex value like #2F80ED');
  }
  return color.toUpperCase();
}

async function findLabel(organizationId: string, labelId: string) {
  return prisma.label.findFirst({
    where: { id: labelId, organizationId },
    select: labelSelect,
  });
}

async function assertNameAvailable(
  organizationId: string,
  name: string,
  exceptId?: string,
) {
  const existing = await prisma.label.findFirst({
    where: {
      organizationId,
      name: { equals: name, mode: 'insensitive' },
      ...(exceptId ? { id: { not: exceptId } } : {}),
    },
    select: { id: true },
  });
  if (existing) {
    throw new ValidationError('Label name already exists');
  }
}

function isUniqueNameError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
}

labelsRouter.get('/', async (req, res) => {
  try {
    const labels = await prisma.label.findMany({
      where: { organizationId: req.org!.id },
      orderBy: { name: 'asc' },
      select: labelSelect,
    });
    sendSuccess(res, { data: { labels: labels.map(publicLabel) } });
  } catch (err) {
    sendError(res, err);
  }
});

labelsRouter.post('/', requireOrgRole(OrgRole.ADMIN), async (req, res) => {
  try {
    const parsed = createLabelBodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid input');
    }

    const name = parsed.data.name;
    const color = parseColor(parsed.data.color);
    await assertNameAvailable(req.org!.id, name);

    try {
      const label = await prisma.label.create({
        data: { organizationId: req.org!.id, name, color },
        select: labelSelect,
      });
      sendSuccess(res, {
        status: HttpStatus.CREATED,
        message: 'Label created',
        data: { label: publicLabel(label) },
      });
    } catch (err) {
      if (isUniqueNameError(err)) {
        throw new ValidationError('Label name already exists');
      }
      throw err;
    }
  } catch (err) {
    sendError(res, err);
  }
});

labelsRouter.patch('/:labelId', requireOrgRole(OrgRole.ADMIN), async (req, res) => {
  try {
    const parsed = patchLabelBodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid input');
    }
    if (parsed.data.name === undefined && parsed.data.color === undefined) {
      throw new ValidationError('No fields to update');
    }

    const existing = await findLabel(req.org!.id, String(req.params.labelId));
    if (!existing) {
      throw new NotFoundError('Label not found');
    }

    const name = parsed.data.name;
    const color =
      parsed.data.color !== undefined ? parseColor(parsed.data.color) : undefined;
    if (name !== undefined) {
      await assertNameAvailable(req.org!.id, name, existing.id);
    }

    try {
      const label = await prisma.label.update({
        where: { id: existing.id },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(color !== undefined ? { color } : {}),
        },
        select: labelSelect,
      });
      sendSuccess(res, {
        message: 'Label updated',
        data: { label: publicLabel(label) },
      });
    } catch (err) {
      if (isUniqueNameError(err)) {
        throw new ValidationError('Label name already exists');
      }
      throw err;
    }
  } catch (err) {
    sendError(res, err);
  }
});

labelsRouter.delete('/:labelId', requireOrgRole(OrgRole.ADMIN), async (req, res) => {
  try {
    const existing = await findLabel(req.org!.id, String(req.params.labelId));
    if (!existing) {
      throw new NotFoundError('Label not found');
    }
    await prisma.label.delete({ where: { id: existing.id } });
    sendSuccess(res, {
      message: 'Label deleted',
      data: { id: existing.id },
    });
  } catch (err) {
    sendError(res, err);
  }
});
