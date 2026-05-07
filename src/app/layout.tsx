import type { Metadata } from 'next';

import '~/app/globals.css';
import { Providers } from '~/app/providers';
import { APP_NAME, APP_DESCRIPTION } from '~/lib/constants';

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  other: {
    "fc:frame": "vNext",
    "fc:frame:image": "https://castrewards-app.vercel.app/og-image.png",
    "fc:frame:button:1": "Open CastRewards",
    "fc:frame:button:1:action": "launch_frame",
    "fc:frame:button:1:target": "https://castrewards-app.vercel.app",
  },
  openGraph: {
    images: ["https://castrewards-app.vercel.app/og-image.png"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}