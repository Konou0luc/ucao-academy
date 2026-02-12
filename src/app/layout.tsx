import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "UCAO Academy UCAO-UUT",
  description: "Plateforme étudiante UCAO-UUT",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={montserrat.variable}>
      <body className="font-sans antialiased" style={{ fontFamily: "var(--font-montserrat), sans-serif" }}>
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          duration={4000}
          toastOptions={{ style: { fontFamily: "var(--font-montserrat), sans-serif" } }}
        />
      </body>
    </html>
  );
}
