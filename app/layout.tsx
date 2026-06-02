import type { Metadata } from "next";
import { AuthSessionProvider } from "@/components/AuthSessionProvider";
import { InterviewProvider } from "@/context/InterviewContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "HireFlow",
  description: "AI mock interviewer with voice, screen capture, and AI feedback",
  icons: {
    icon: "/icon.svg"
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthSessionProvider>
          <InterviewProvider>{children}</InterviewProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
