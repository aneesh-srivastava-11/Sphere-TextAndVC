import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Sphere — Team Communication",
  description: "Real-time, topic-based team communication",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-surface`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
