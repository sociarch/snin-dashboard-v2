import '../polyfills'
import type { Metadata } from "next";
import './globals.css'
import { Libre_Baskerville, Roboto } from 'next/font/google'
import { ThemeProvider } from "@/components/theme-provider"
import ClientLayout from "./ClientLayout"
import { Analytics } from "@/components/analytics";

const libreBaskerville = Libre_Baskerville({ 
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-libre-baskerville'
})

const roboto = Roboto({ 
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto'
})

export const metadata: Metadata = {
  title: "SnapInput Dashboard",
  description: "SnapInput Analytics Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={`${libreBaskerville.variable} ${roboto.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClientLayout>
            {children}
          </ClientLayout>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
