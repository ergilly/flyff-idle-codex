import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flyff Idle",
  description: "Idle RPG prototype inspired by Fly For Fun"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem("flyffIdleTheme") === "light" ? "light" : "dark";
                document.documentElement.dataset.theme = theme;
              } catch {
                document.documentElement.dataset.theme = "dark";
              }
            `
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
