import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { StateProvider } from "../context/StateContext";
import { NotifyProvider } from "../context/NotifyContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ECTTS 3.0",
  description: "A tool that automatically reads a word set and allows you to set the number of repetitions, speed, pause time, etc. It includes flashcards, tag management, synchronization function, quiz mode, and other features.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <StateProvider>
          <NotifyProvider>
            {children}
          </NotifyProvider>
        </StateProvider>
      </body>
    </html>
  );
}