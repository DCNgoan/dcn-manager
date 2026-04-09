import type { Metadata } from "next";
import "@/styles/globals.css";
import ClientWrapper from "@/components/ClientWrapper";
import { AuthProvider } from "@/contexts/AuthContext";
import { ConfirmProvider } from "@/contexts/ConfirmContext";
import { ToastProvider } from "@/contexts/ToastContext";

export const metadata: Metadata = {
  title: "DCN Content CMS - Phiên bản MMO",
  description: "Hệ thống quản lý nội dung cho TikTok, Facebook và Threads",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          <ConfirmProvider>
            <ToastProvider>
              <ClientWrapper>
                {children}
              </ClientWrapper>
            </ToastProvider>
          </ConfirmProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
