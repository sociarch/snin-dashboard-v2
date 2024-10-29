import type { Metadata } from "next";
import localFont from "next/font/local";
import './globals.css'
import { Inter, Roboto, Libre_Baskerville } from 'next/font/google'
import { ThemeProvider } from "@/components/theme-provider"
import ClientLayout from "./ClientLayout"
import Script from 'next/script'

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: 'swap',
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: 'swap',
});

const inter = Inter({ subsets: ['latin'], display: 'swap' })
const roboto = Roboto({ weight: ['400', '700'], subsets: ['latin'], display: 'swap' })
const libreBaskerville = Libre_Baskerville({ weight: ['400', '700'], subsets: ['latin'], display: 'swap' })

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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <ClientLayout>
            {children}
          </ClientLayout>
        </ThemeProvider>
      </body>
    </html>
  )
}
