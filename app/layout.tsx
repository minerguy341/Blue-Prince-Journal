import { Architects_Daughter, Caveat, Source_Serif_4, Special_Elite } from "next/font/google";
import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const stamp = Special_Elite({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-stamp",
});

const hand = Architects_Daughter({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-hand",
});

const script = Caveat({
  subsets: ["latin"],
  variable: "--font-script",
});

const print = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-print",
});

export const metadata: Metadata = {
  title: "Blue Prince Notes Organizer",
  description:
    "A spiral-bound Mount Holly notebook that files only what your Blue Prince save has already found.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${stamp.variable} ${hand.variable} ${script.variable} ${print.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
