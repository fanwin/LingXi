import { Inter } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";
import "./globals.css";
// eslint-disable  MC8yOmFIVnBZMlhvaklQb3RvVTZhR2RtUXc9PTo3M2UwYTYwMg==

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
    >
      <body
        className={inter.className}
        suppressHydrationWarning
      >
        <NuqsAdapter>{children}</NuqsAdapter>
        <Toaster />
      </body>
    </html>
  );
}
// FIXME  MS8yOmFIVnBZMlhvaklQb3RvVTZhR2RtUXc9PTo3M2UwYTYwMg==
