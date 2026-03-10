import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/aurum-auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aurum - Assistente Pessoal com IA e Voz",
  description: "Organize tarefas, hábitos, projetos e finanças com comandos de voz. Assistente pessoal com inteligência artificial. Gratuito para sempre.",
  keywords: ["assistente pessoal", "inteligência artificial", "IA", "produtividade", "tarefas", "hábitos", "voz", "aurum"],
  authors: [{ name: "Sestari Digital" }],
  openGraph: {
    title: "Aurum - Assistente Pessoal com IA e Voz",
    description: "Organize sua vida com inteligência artificial e comandos de voz. Gratuito.",
    type: "website",
    locale: "pt_BR",
    siteName: "Aurum",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aurum - Assistente Pessoal com IA e Voz",
    description: "Organize sua vida com inteligência artificial e comandos de voz.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
