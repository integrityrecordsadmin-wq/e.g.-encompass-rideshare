import "./globals.css";

export const metadata = {
  title: "Rideshare",
  description: "Rider, driver, and admin apps",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#111318",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
