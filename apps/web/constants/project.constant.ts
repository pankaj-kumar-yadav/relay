import { orgPath } from '@/constants/org.constant';

export {
   ProjectStatus,
   ProjectHealth,
   DEFAULT_PROJECT_STATUS,
   DEFAULT_PROJECT_HEALTH,
   PROJECT_ICON_MAX,
   isProjectStatus,
   isProjectHealth,
   type ProjectStatusValue,
   type ProjectHealthValue,
} from '@relay/shared/constants/project.constant';

export const ProjectPath = {
   LIST: '/projects',
} as const;

export const ProjectTab = {
   OVERVIEW: 'overview',
   ACTIVITY: 'activity',
   ISSUES: 'issues',
} as const;

export type ProjectTabValue = (typeof ProjectTab)[keyof typeof ProjectTab];

export function projectPath(
   orgSlug: string,
   projectId: string,
   tab: ProjectTabValue = ProjectTab.OVERVIEW
): string {
   return orgPath(orgSlug, `/project/${projectId}/${tab}`);
}

export function projectOverviewPath(orgSlug: string, projectId: string): string {
   return projectPath(orgSlug, projectId, ProjectTab.OVERVIEW);
}

export function projectActivityPath(orgSlug: string, projectId: string): string {
   return projectPath(orgSlug, projectId, ProjectTab.ACTIVITY);
}

export function projectIssuesPath(orgSlug: string, projectId: string): string {
   return projectPath(orgSlug, projectId, ProjectTab.ISSUES);
}

export function projectsPath(orgSlug: string): string {
   return orgPath(orgSlug, ProjectPath.LIST);
}
