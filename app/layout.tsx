import type { Metadata } from "next";
import localFont from "next/font/local";
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
    <html lang="en" className={`${libreBaskerville.variable} ${roboto.variable}`} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-PXZXKPL9');`,
          }}
        />
        {/* End Google Tag Manager */}
      </head>
      <body className={libreBaskerville.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <ClientLayout>
            {children}
          </ClientLayout>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
