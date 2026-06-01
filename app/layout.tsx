import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthSessionProvider } from "@/components/AuthSessionProvider";
import { InterviewProvider } from "@/context/InterviewContext";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HireFlow",
  description: "AI mock interviewer with voice, screen capture, and AI feedback"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthSessionProvider>
          <InterviewProvider>{children}</InterviewProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
