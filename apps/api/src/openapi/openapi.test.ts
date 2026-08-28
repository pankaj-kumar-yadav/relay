import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createApp } from '@/app.js';
import { API_PREFIX, ErrorCode, HttpStatus } from '@/constants/http.js';
import {
  OPENAPI_DOCS_PATH,
  OPENAPI_HTTP_CLIENT,
  OPENAPI_JSON_PATH,
} from '@/constants/openapi.constant.js';
import { close, listen } from '@/test/http.js';

const DOCUMENTED_PATHS = [
  '/health',
  '/auth/register',
  '/auth/login',
  '/auth/logout',
  '/auth/session',
  '/auth/refresh',
  '/orgs',
  '/orgs/{orgId}',
  '/orgs/{orgId}/invites',
  '/invites/{token}/accept',
  '/orgs/{orgId}/teams',
  '/orgs/{orgId}/teams/{teamId}',
  '/orgs/{orgId}/teams/{teamId}/cycles',
  '/orgs/{orgId}/teams/{teamId}/cycles/{cycleId}',
  '/orgs/{orgId}/projects',
  '/orgs/{orgId}/projects/{projectId}',
  '/orgs/{orgId}/members',
  '/orgs/{orgId}/labels',
  '/orgs/{orgId}/labels/{labelId}',
  '/orgs/{orgId}/notifications',
  '/orgs/{orgId}/notifications/read-all',
  '/orgs/{orgId}/notifications/{notificationId}/read',
  '/orgs/{orgId}/issues',
  '/orgs/{orgId}/issues/{issueId}',
  '/orgs/{orgId}/issues/{issueId}/labels',
  '/orgs/{orgId}/issues/{issueId}/activity',
  '/orgs/{orgId}/issues/{issueId}/comments',
  '/orgs/{orgId}/issues/{issueId}/comments/{commentId}',
  '/orgs/{orgId}/issues/{issueId}/comments/{commentId}/reactions',
] as const;

test('GET /openapi.json documents health, auth, and org-scoped paths', async () => {
  const { server, origin } = await listen();
  try {
    const res = await fetch(`${origin}${API_PREFIX}${OPENAPI_JSON_PATH}`);
    const spec = (await res.json()) as {
      openapi: string;
      paths: Record<string, unknown>;
      servers?: Array<{ url: string }>;
    };
    assert.equal(res.status, HttpStatus.OK);
    assert.match(spec.openapi, /^3\./);
    assert.equal(spec.servers?.[0]?.url, API_PREFIX);
    for (const path of DOCUMENTED_PATHS) {
      assert.ok(spec.paths[path], `missing OpenAPI path ${path}`);
    }
  } finally {
    await close(server);
  }
});

test('GET /docs serves the Scalar API reference', async () => {
  const { server, origin } = await listen();
  try {
    const res = await fetch(`${origin}${OPENAPI_DOCS_PATH}`);
    const body = await res.text();
    assert.equal(res.status, HttpStatus.OK);
    assert.match(res.headers.get('content-type') ?? '', /html/i);
    assert.match(body, /scalar/i);
    assert.match(body, new RegExp(`"targetKey":\\s*"${OPENAPI_HTTP_CLIENT.targetKey}"`));
    assert.match(body, new RegExp(`"clientKey":\\s*"${OPENAPI_HTTP_CLIENT.clientKey}"`));

    const versioned = await fetch(`${origin}${API_PREFIX}${OPENAPI_DOCS_PATH}`);
    assert.equal(versioned.status, HttpStatus.NOT_FOUND);
  } finally {
    await close(server);
  }
});

test('docs routes are absent when disabled', async () => {
  const { server, origin } = await listen(createApp({ docs: false }));
  try {
    const docsRes = await fetch(`${origin}${OPENAPI_DOCS_PATH}`);
    const docsBody = (await docsRes.json()) as {
      success: boolean;
      error: { code: string } | null;
    };
    assert.equal(docsRes.status, HttpStatus.NOT_FOUND);
    assert.equal(docsBody.success, false);
    assert.equal(docsBody.error?.code, ErrorCode.NOT_FOUND);

    const specRes = await fetch(`${origin}${API_PREFIX}${OPENAPI_JSON_PATH}`);
    const specBody = (await specRes.json()) as {
      success: boolean;
      error: { code: string } | null;
    };
    assert.equal(specRes.status, HttpStatus.NOT_FOUND);
    assert.equal(specBody.success, false);
    assert.equal(specBody.error?.code, ErrorCode.NOT_FOUND);
  } finally {
    await close(server);
  }
});
