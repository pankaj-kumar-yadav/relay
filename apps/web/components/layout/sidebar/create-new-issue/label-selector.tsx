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
import { useLabels } from '@/hooks/use-labels';
import { LabelInterface } from '@/mock-data/labels';
import { CheckIcon, TagIcon } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useId, useState } from 'react';
import { cn } from '@/lib/utils';

interface LabelSelectorProps {
  selectedLabels: LabelInterface[];
  onChange: (labels: LabelInterface[]) => void;
}

export function LabelSelector({ selectedLabels, onChange }: LabelSelectorProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const { orgId } = useParams<{ orgId: string }>();
  const { data: labels = [] } = useLabels(orgId);

  const handleLabelToggle = (label: LabelInterface) => {
    const isSelected = selectedLabels.some((item) => item.id === label.id);
    onChange(
      isSelected
        ? selectedLabels.filter((item) => item.id !== label.id)
        : [...selectedLabels, label],
    );
  };

  return (
    <div className="*:not-first:mt-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            className={cn(
              'flex items-center justify-center',
              selectedLabels.length === 0 && 'size-7',
            )}
            size={selectedLabels.length > 0 ? 'xs' : 'icon'}
            variant="secondary"
            role="combobox"
            aria-expanded={open}
            aria-label="Labels"
          >
            <TagIcon className="size-4" />
            {selectedLabels.length > 0 && (
              <div className="flex -space-x-0.5">
                {selectedLabels.map((label) => (
                  <div
                    key={label.id}
                    className="size-3 rounded-full"
                    style={{ backgroundColor: label.color }}
                  />
                ))}
              </div>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="border-input w-full min-w-[var(--radix-popper-anchor-width)] p-0"
          align="start"
        >
          <Command>
            <CommandInput placeholder="Search labels..." />
            <CommandList>
              <CommandEmpty>No labels found.</CommandEmpty>
              <CommandGroup>
                {labels.map((label) => {
                  const isSelected = selectedLabels.some((item) => item.id === label.id);
                  return (
                    <CommandItem
                      key={label.id}
                      value={label.name}
                      onSelect={() => handleLabelToggle(label)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="size-3 rounded-full"
                          style={{ backgroundColor: label.color }}
                        />
                        <span>{label.name}</span>
                      </div>
                      {isSelected && <CheckIcon size={16} className="ml-auto" />}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
