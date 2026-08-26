import AllIssues from '@/components/common/issues/all-issues';
import { IssueStatusCategory } from '@/constants/issue.constant';
import Header from '@/components/layout/headers/issues/header';
import MainLayout from '@/components/layout/main-layout';

export default function ActiveIssuesPage() {
   return (
      <MainLayout header={<Header />}>
         <AllIssues categories={[IssueStatusCategory.UNSTARTED, IssueStatusCategory.STARTED]} />
      </MainLayout>
   );
}
