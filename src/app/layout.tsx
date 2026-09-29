import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MOET Builder | Demo kéo thả giao diện",
  description: "Demo trình dựng trang bằng Next.js, React, TypeScript và Supabase.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>;
}
