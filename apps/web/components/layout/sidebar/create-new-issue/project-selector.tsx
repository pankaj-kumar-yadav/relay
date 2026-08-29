'use client';

import { ProjectIcon } from '@/components/common/projects/project-icon';
import { Button } from '@/components/ui/button';
import {
   Command,
   CommandEmpty,
   CommandGroup,
   CommandInput,
   CommandItem,
   CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useProjects } from '@/hooks/use-projects';
import { Project } from '@/mock-data/projects';
import { Box, CheckIcon, FolderIcon } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useId, useMemo, useState } from 'react';

interface ProjectSelectorProps {
   project: Project | undefined;
   onChange: (project: Project | undefined) => void;
   teamKey?: string;
}

export function ProjectSelector({ project, onChange, teamKey }: ProjectSelectorProps) {
   const id = useId();
   const { orgId } = useParams<{ orgId: string }>();
   const [open, setOpen] = useState(false);
   const [value, setValue] = useState<string | undefined>(project?.id);
   const { data: projects = [] } = useProjects(orgId, { teamId: teamKey });

   const options = useMemo(
      () => (teamKey ? projects.filter((item) => item.teamId === teamKey) : projects),
      [projects, teamKey],
   );

   useEffect(() => {
      setValue(project?.id);
   }, [project]);

   const selected = options.find((item) => item.id === value) ?? project;

   const handleProjectChange = (projectId: string) => {
      if (projectId === 'no-project') {
         setValue(undefined);
         onChange(undefined);
      } else {
         const next = options.find((item) => item.id === projectId);
         setValue(projectId);
         if (next) onChange(next);
      }
      setOpen(false);
   };

   return (
      <div className="*:not-first:mt-2">
         <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
               <Button
                  id={id}
                  className="flex items-center justify-center"
                  size="xs"
                  variant="secondary"
                  role="combobox"
                  aria-expanded={open}
               >
                  {selected ? (
                     <ProjectIcon icon={selected.icon} name={selected.name} className="size-4 text-xs" />
                  ) : (
                     <Box className="size-4" />
                  )}
                  <span>{selected?.name ?? 'No project'}</span>
               </Button>
            </PopoverTrigger>
            <PopoverContent
               className="border-input w-full min-w-[var(--radix-popper-anchor-width)] p-0"
               align="start"
            >
               <Command>
                  <CommandInput placeholder="Set project..." />
                  <CommandList>
                     <CommandEmpty>No projects found.</CommandEmpty>
                     <CommandGroup>
                        <CommandItem
                           value="no-project"
                           onSelect={() => handleProjectChange('no-project')}
                           className="flex items-center justify-between"
                        >
                           <div className="flex items-center gap-2">
                              <FolderIcon className="size-4" />
                              No Project
                           </div>
                           {value === undefined && <CheckIcon size={16} className="ml-auto" />}
                        </CommandItem>
                        {options.map((item) => (
                           <CommandItem
                              key={item.id}
                              value={`${item.name} ${item.id}`}
                              onSelect={() => handleProjectChange(item.id)}
                              className="flex items-center justify-between"
                           >
                              <div className="flex items-center gap-2">
                                 <ProjectIcon icon={item.icon} name={item.name} className="size-4 text-xs" />
                                 {item.name}
                              </div>
                              {value === item.id && <CheckIcon size={16} className="ml-auto" />}
                           </CommandItem>
                        ))}
                     </CommandGroup>
                  </CommandList>
               </Command>
            </PopoverContent>
         </Popover>
      </div>
   );
}
