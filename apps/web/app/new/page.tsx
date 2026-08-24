'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError } from '@/lib/api';
import { useCreateOrg } from '@/hooks/use-orgs';
import { teamHomePath } from '@/lib/paths';

export default function NewOrgPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState<string | null>(null);
  const createOrg = useCreateOrg();
  const submitting = createOrg.isPending;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    try {
      const data = await createOrg.mutateAsync({ name, slug });
      router.push(teamHomePath(data.organization.slug, data.team.key));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create organization');
    }
  }

  return (
    <div className="min-h-svh bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-[360px]">
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="flex aspect-square size-8 items-center justify-center rounded bg-orange-500 text-sm font-semibold text-sidebar-primary-foreground">
            R
          </div>
          <h1 className="text-lg font-semibold tracking-tight">Create an organization</h1>
          <p className="text-sm text-muted-foreground">This will be your workspace URL.</p>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slug) {
                  setSlug(
                    e.target.value
                      .trim()
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-|-$/g, ''),
                  );
                }
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={submitting}>
            Create
          </Button>
        </form>
      </div>
    </div>
  );
}
