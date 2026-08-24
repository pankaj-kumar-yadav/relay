import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Heart } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RiEditLine } from '@remixicon/react';
import { useState, useEffect, useCallback } from 'react';
import { Issue } from '@/mock-data/issues';
import { priorities } from '@/mock-data/priorities';
import { status } from '@/mock-data/status';
import { useCreateIssueStore } from '@/store/create-issue-store';
import { toast } from 'sonner';
import { StatusSelector } from './status-selector';
import { PrioritySelector } from './priority-selector';
import { AssigneeSelector } from './assignee-selector';
import { DialogTitle } from '@radix-ui/react-dialog';
import { useCreateIssue } from '@/hooks/use-issues';
import { useTeams } from '@/hooks/use-teams';
import { DEFAULT_TEAM_KEY } from '@/lib/paths';
import { useParams } from 'next/navigation';

export function CreateNewIssue() {
   const [createMore, setCreateMore] = useState<boolean>(false);
   const { isOpen, defaultStatus, openModal, closeModal } = useCreateIssueStore();
   const { orgId, teamId } = useParams<{ orgId: string; teamId?: string }>();
   const { data: teams = [] } = useTeams(orgId);
   const createIssueMutation = useCreateIssue();
   const teamKey = teamId ?? teams[0]?.key ?? DEFAULT_TEAM_KEY;

   const createDefaultData = useCallback((): Issue => {
      return {
         id: 'new',
         identifier: '',
         title: '',
         description: '',
         status: defaultStatus || status.find((s) => s.id === 'to-do')!,
         assignee: null,
         priority: priorities.find((p) => p.id === 'no-priority')!,
         labels: [],
         createdAt: new Date().toISOString(),
         cycleId: '',
         project: undefined,
         subissues: [],
         rank: '',
      };
   }, [defaultStatus]);

   const [addIssueForm, setAddIssueForm] = useState<Issue>(createDefaultData());

   useEffect(() => {
      setAddIssueForm(createDefaultData());
   }, [createDefaultData]);

   const createIssue = async () => {
      if (!addIssueForm.title) {
         toast.error('Title is required');
         return;
      }
      if (!orgId) {
         toast.error('No organization selected');
         return;
      }
      try {
         await createIssueMutation.mutateAsync({
            title: addIssueForm.title,
            description: addIssueForm.description,
            status: addIssueForm.status.id,
            priority: addIssueForm.priority.id,
            assigneeId: addIssueForm.assignee?.id ?? null,
            teamId: teamKey,
         });
         toast.success('Issue created');
         if (!createMore) {
            closeModal();
         }
         setAddIssueForm(createDefaultData());
      } catch {
         toast.error('Could not create issue');
      }
   };

   return (
      <Dialog open={isOpen} onOpenChange={(value) => (value ? openModal() : closeModal())}>
         <DialogTrigger asChild>
            <Button className="size-8 shrink-0" variant="secondary" size="icon">
               <RiEditLine />
            </Button>
         </DialogTrigger>
         <DialogContent className="w-full sm:max-w-[750px] p-0 shadow-xl top-[30%]">
            <DialogHeader>
               <DialogTitle>
                  <div className="flex items-center px-4 pt-4 gap-2">
                     <Button size="sm" variant="outline" className="gap-1.5">
                        <Heart className="size-4 text-orange-500 fill-orange-500" />
                        <span className="font-medium">{teamKey}</span>
                     </Button>
                  </div>
               </DialogTitle>
            </DialogHeader>

            <div className="px-4 pb-0 space-y-3 w-full">
               <Input
                  className="border-none w-full shadow-none outline-none text-2xl font-medium px-0 h-auto focus-visible:ring-0 overflow-hidden text-ellipsis whitespace-normal break-words"
                  placeholder="Issue title"
                  value={addIssueForm.title}
                  onChange={(e) => setAddIssueForm({ ...addIssueForm, title: e.target.value })}
               />

               <Textarea
                  className="border-none w-full shadow-none outline-none resize-none px-0 min-h-16 focus-visible:ring-0 break-words whitespace-normal overflow-wrap"
                  placeholder="Add description..."
                  value={addIssueForm.description}
                  onChange={(e) =>
                     setAddIssueForm({ ...addIssueForm, description: e.target.value })
                  }
               />

               <div className="w-full flex items-center justify-start gap-1.5 flex-wrap">
                  <StatusSelector
                     status={addIssueForm.status}
                     onChange={(newStatus) =>
                        setAddIssueForm({ ...addIssueForm, status: newStatus })
                     }
                  />
                  <PrioritySelector
                     priority={addIssueForm.priority}
                     onChange={(newPriority) =>
                        setAddIssueForm({ ...addIssueForm, priority: newPriority })
                     }
                  />
                  <AssigneeSelector
                     assignee={addIssueForm.assignee}
                     onChange={(newAssignee) =>
                        setAddIssueForm({ ...addIssueForm, assignee: newAssignee })
                     }
                  />
               </div>
            </div>
            <div className="flex items-center justify-between py-2.5 px-4 w-full border-t">
               <div className="flex items-center gap-2">
                  <div className="flex items-center space-x-2">
                     <Switch
                        id="create-more"
                        checked={createMore}
                        onCheckedChange={setCreateMore}
                     />
                     <Label htmlFor="create-more">Create more</Label>
                  </div>
               </div>
               <Button size="sm" onClick={() => void createIssue()}>
                  Create issue
               </Button>
            </div>
         </DialogContent>
      </Dialog>
   );
}
