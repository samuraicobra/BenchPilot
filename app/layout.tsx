import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const base = new URL(`${protocol}://${host}`);

  return {
    metadataBase: base,
    title: "BenchPilot — Turn experiments into evidence",
    description:
      "A multimodal AI lab partner that turns messy physical experiments into reproducible evidence.",
    openGraph: {
      title: "BenchPilot",
      description:
        "Turn messy physical experiments into reproducible evidence.",
      type: "website",
      images: [
        {
          url: new URL("/og.png", base).toString(),
          width: 1728,
          height: 909,
          alt: "BenchPilot evidence workflow and Hypothesis Matrix",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "BenchPilot",
      description:
        "Turn messy physical experiments into reproducible evidence.",
      images: [new URL("/og.png", base).toString()],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
