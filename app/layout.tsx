import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import AuthProvider from '@/components/auth-provider'; // Adjust path if needed
import { auth } from '@/auth'; // Import your server-side auth helper

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'RD Realty Group - LMS',
  description: 'Leave and overtime management system',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch the session on the server
  const session = await auth();

  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Pass the server session to the provider */}
        <AuthProvider session={session}>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}