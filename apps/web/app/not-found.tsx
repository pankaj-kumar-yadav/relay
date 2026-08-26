import { AppRoute } from '@/constants/auth.constant';
import { redirect } from 'next/navigation';

export default function NotFound() {
   redirect(AppRoute.HOME);
}
