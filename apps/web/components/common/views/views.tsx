'use client';

import { CreateViewButton } from '@/components/common/views/create-view-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select';
import { DateFormat, formatDate } from '@/constants/date.constant';
import { dicebearAvatarUrl } from '@/constants/user.constant';
import { VIEW_ICON, viewPath } from '@/constants/view.constant';
import { useOrgs } from '@/hooks/use-orgs';
import { useTeam, useTeams } from '@/hooks/use-teams';
import { useViews } from '@/hooks/use-views';
import { cn } from '@/lib/utils';
import type { ApiView, ViewFilters } from '@/services/views.service';
import { useViewsDisplayStore, ViewsOrdering } from '@/store/views-display-store';
import { ArrowDown, Plus, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';

function viewFiltersSummary(filters: ViewFilters): string {
   const parts: string[] = [];
   if (filters.teamId) parts.push('Team');
   if (filters.status) parts.push(filters.status);
   if (filters.priority) parts.push(filters.priority);
   if (filters.statusCategory) parts.push(filters.statusCategory);
   if (filters.labelId) parts.push('Label');
   if (filters.assigneeId) parts.push('Assignee');
   if (filters.projectId) parts.push('Project');
   if (filters.cycleId) parts.push('Cycle');
   if (filters.q) parts.push(`“${filters.q}”`);
   return parts.join(' · ') || 'All issues';
}

function matchesTeam(view: ApiView, team: { id: string; key: string }): boolean {
   const teamId = view.filters.teamId;
   return teamId === team.id || teamId === team.key;
}

function DisplayOptions() {
   const { ordering, displayProperties, setOrdering, toggleProperty } = useViewsDisplayStore();

   return (
      <Popover>
         <PopoverTrigger asChild>
            <Button size="xs" variant="ghost">
               <SlidersHorizontal className="size-4" />
            </Button>
         </PopoverTrigger>
         <PopoverContent align="end" className="w-72 p-3 flex flex-col gap-3">
            <div className="flex items-center justify-between">
               <span className="text-xs text-muted-foreground">Ordering</span>
               <Select
                  value={ordering}
                  onValueChange={(value) => setOrdering(value as ViewsOrdering)}
               >
                  <SelectTrigger className="w-32 h-7 text-xs">
                     <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="name">Name</SelectItem>
                     <SelectItem value="created">Created</SelectItem>
                     <SelectItem value="updated">Updated</SelectItem>
                  </SelectContent>
               </Select>
            </div>
            <div className="flex flex-col gap-2">
               <span className="text-xs text-muted-foreground">Display properties</span>
               <div className="flex flex-wrap gap-1.5">
                  {(
                     [
                        ['created', 'Created'],
                        ['updated', 'Updated'],
                        ['owner', 'Owner'],
                     ] as const
                  ).map(([key, label]) => (
                     <button
                        key={key}
                        onClick={() => toggleProperty(key)}
                        className={cn(
                           'px-2 py-0.5 rounded-md border text-xs transition-colors',
                           displayProperties[key]
                              ? 'bg-accent border-transparent'
                              : 'text-muted-foreground hover:bg-accent/50'
                        )}
                     >
                        {label}
                     </button>
                  ))}
               </div>
            </div>
         </PopoverContent>
      </Popover>
   );
}

function ViewRow({ view, orgId }: { view: ApiView; orgId: string }) {
   const { displayProperties } = useViewsDisplayStore();
   return (
      <Link
         href={viewPath(orgId, view.slug)}
         className="flex items-center gap-3 px-6 py-2.5 border-b border-border/50 hover:bg-sidebar/50 transition-colors"
      >
         <span className="inline-flex size-6 items-center justify-center rounded bg-muted/50 text-sm shrink-0">
            {VIEW_ICON}
         </span>
         <span className="flex flex-col min-w-0 flex-1">
            <span className="text-sm font-medium truncate">{view.name}</span>
            <span className="text-xs text-muted-foreground truncate">
               {viewFiltersSummary(view.filters)}
            </span>
         </span>
         {displayProperties.created && (
            <span className="hidden sm:block text-xs text-muted-foreground w-24 shrink-0">
               {formatDate(view.createdAt, DateFormat.MONTH_DAY_YEAR)}
            </span>
         )}
         {displayProperties.updated && (
            <span className="hidden sm:block text-xs text-muted-foreground w-24 shrink-0">
               {formatDate(view.updatedAt, DateFormat.MONTH_DAY_YEAR)}
            </span>
         )}
         {displayProperties.owner && (
            <span className="flex items-center gap-1.5 w-32 shrink-0 justify-end">
               <Avatar className="size-5">
                  <AvatarImage src={dicebearAvatarUrl(view.owner.id)} alt={view.owner.name} />
                  <AvatarFallback className="text-[9px]">
                     {view.owner.name
                        .split(' ')
                        .map((part) => part[0])
                        .join('')}
                  </AvatarFallback>
               </Avatar>
               <span className="text-xs text-muted-foreground truncate max-w-24">
                  {view.owner.name}
               </span>
            </span>
         )}
      </Link>
   );
}

/**
 * "Views" page: saved issue views. With a `teamId`, only that team's views
 * are listed (team sidebar "Views" entry); otherwise the whole workspace.
 */
export default function Views({ teamId }: { teamId?: string }) {
   const { orgId } = useParams<{ orgId: string }>();
   const { ordering } = useViewsDisplayStore();
   const { data: orgs = [] } = useOrgs();
   const { data: views = [], isLoading } = useViews(orgId);
   const { data: team } = useTeam(orgId, teamId);
   const { data: teams = [] } = useTeams(orgId);
   const org = orgs.find((item) => item.slug === orgId || item.id === orgId);
   const resolvedTeam =
      team ?? teams.find((item) => item.id === teamId || item.key === teamId);

   const list = useMemo(() => {
      let source = views;
      if (resolvedTeam) source = source.filter((view) => matchesTeam(view, resolvedTeam));
      return [...source].sort((a, b) => {
         if (ordering === 'created') return b.createdAt.localeCompare(a.createdAt);
         if (ordering === 'updated') return b.updatedAt.localeCompare(a.updatedAt);
         return a.name.localeCompare(b.name);
      });
   }, [views, ordering, resolvedTeam]);

   return (
      <div className="w-full h-full overflow-y-auto">
         <div className="flex items-center justify-between px-6 pt-3 pb-2">
            <div className="flex items-center gap-1.5">
               <button className="px-2.5 py-1 rounded-md border text-xs font-medium bg-accent border-transparent">
                  Issues
               </button>
               {/* Projects tab — out of v1; restore later
               <button className="px-2.5 py-1 rounded-md border text-xs font-medium capitalize text-muted-foreground hover:bg-accent/50">
                  projects
               </button>
               */}
            </div>
            <DisplayOptions />
         </div>

         <div className="flex items-center gap-1 px-6 py-1.5 text-xs text-muted-foreground border-b">
            Name
            <ArrowDown className="size-3" />
         </div>

         <div className="flex items-center justify-between px-6 py-2 bg-sidebar/60 border-b border-border/50">
            <span className="flex items-center gap-2 text-sm">
               {resolvedTeam ? (
                  <span className="inline-flex size-5 items-center justify-center rounded bg-muted/50 text-xs">
                     {resolvedTeam.icon || resolvedTeam.key.slice(0, 1)}
                  </span>
               ) : (
                  <span className="inline-flex size-5 items-center justify-center rounded bg-primary text-primary-foreground text-[10px] font-semibold">
                     {(org?.name ?? orgId).slice(0, 2).toUpperCase()}
                  </span>
               )}
               <span className="font-medium">
                  {resolvedTeam ? resolvedTeam.name : (org?.name ?? 'Workspace')}
               </span>
               <span className="text-muted-foreground text-xs">
                  · {resolvedTeam ? 'Team' : 'Workspace'}
               </span>
            </span>
            <CreateViewButton
               defaultTeamId={resolvedTeam?.id}
               trigger={
                  <Button size="xs" variant="ghost">
                     <Plus className="size-3.5" />
                  </Button>
               }
            />
         </div>

         {isLoading && (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
               Loading views…
            </div>
         )}
         {!isLoading &&
            list.map((view) => <ViewRow key={view.id} view={view} orgId={orgId} />)}
         {!isLoading && list.length === 0 && (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
               No views yet
            </div>
         )}
      </div>
   );
}
