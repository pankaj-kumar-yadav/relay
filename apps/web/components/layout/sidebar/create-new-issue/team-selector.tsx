'use client';

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
import { useTeams } from '@/hooks/use-teams';
import type { TeamSummary } from '@/services/teams.service';
import { CheckIcon, Heart } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';

interface TeamSelectorProps {
   teamKey: string;
   onChange: (team: TeamSummary) => void;
}

export function TeamSelector({ teamKey, onChange }: TeamSelectorProps) {
   const { orgId } = useParams<{ orgId: string }>();
   const { data: teams = [] } = useTeams(orgId);
   const [open, setOpen] = useState(false);
   const selected = useMemo(
      () => teams.find((team) => team.key === teamKey) ?? teams[0],
      [teams, teamKey],
   );

   return (
      <Popover open={open} onOpenChange={setOpen}>
         <PopoverTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1.5">
               <Heart className="size-4 text-orange-500 fill-orange-500" />
               <span className="font-medium">{selected?.key ?? teamKey}</span>
            </Button>
         </PopoverTrigger>
         <PopoverContent className="w-56 p-0" align="start">
            <Command>
               <CommandInput placeholder="Set team..." />
               <CommandList>
                  <CommandEmpty>No teams found.</CommandEmpty>
                  <CommandGroup>
                     {teams.map((team) => (
                        <CommandItem
                           key={team.id}
                           value={`${team.name} ${team.key}`}
                           onSelect={() => {
                              onChange(team);
                              setOpen(false);
                           }}
                        >
                           {team.name}
                           <span className="ml-auto text-xs text-muted-foreground">{team.key}</span>
                           {team.key === teamKey && <CheckIcon size={16} className="ml-1" />}
                        </CommandItem>
                     ))}
                  </CommandGroup>
               </CommandList>
            </Command>
         </PopoverContent>
      </Popover>
   );
}
