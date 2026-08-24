import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Toaster } from '@/components/ui/sonner';
import { QueryProvider } from '@/components/layout/query-provider';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { BRAND_DESCRIPTION, BRAND_NAME } from '@/constants/brand.constant';
import './globals.css';

const geistSans = Geist({
   variable: '--font-geist-sans',
   subsets: ['latin'],
});

const geistMono = Geist_Mono({
   variable: '--font-geist-mono',
   subsets: ['latin'],
});

export const metadata: Metadata = {
   title: BRAND_NAME,
   description: BRAND_DESCRIPTION,
   applicationName: BRAND_NAME,
   openGraph: {
      type: 'website',
      locale: 'en_US',
      siteName: BRAND_NAME,
      title: BRAND_NAME,
      description: BRAND_DESCRIPTION,
   },
   twitter: {
      card: 'summary',
      title: BRAND_NAME,
      description: BRAND_DESCRIPTION,
   },
   keywords: [BRAND_NAME, 'project management', 'issues', 'teams'],
};

export default function RootLayout({
   children,
}: Readonly<{
   children: React.ReactNode;
}>) {
   return (
      <html lang="en" suppressHydrationWarning>
         <head>
            <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
         </head>
         <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background`}
            suppressHydrationWarning
         >
            <NuqsAdapter>
               <QueryProvider>
                  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
                     {children}
                     <Toaster />
                  </ThemeProvider>
               </QueryProvider>
            </NuqsAdapter>
         </body>
      </html>
   );
}
