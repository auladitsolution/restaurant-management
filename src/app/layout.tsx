import type { Metadata } from "next";
import { Hind_Siliguri } from "next/font/google";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { Toaster } from "sonner";
import "./globals.css";

const hindSiliguri = Hind_Siliguri({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["bengali", "latin"],
  variable: "--font-hind-siliguri",
  display: "swap",
});

export const metadata: Metadata = {
  title: "স্বাদ রেস্টুরেন্ট POS ও ম্যানেজমেন্ট সিস্টেম | Aulad IT Solution",
  description: "আধুনিক রেস্টুরেন্ট বিলিং, পয়েন্ট অফ সেলস, কিচেন এবং ইনভেন্টরি ম্যানেজমেন্ট সিস্টেম",
  icons: {
    icon: [
      { url: "/icon.png?v=2", type: "image/png", sizes: "32x32" },
      { url: "/icon.svg?v=2", type: "image/svg+xml" },
      { url: "/favicon.ico?v=2" },
    ],
    shortcut: "/icon.png?v=2",
    apple: "/apple-icon.png?v=2",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" className={`${hindSiliguri.variable} font-sans h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 selection:bg-amber-500 selection:text-white">
        <AuthProvider>
          {children}
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
