import type { Metadata } from 'next';
import { DM_Sans, Instrument_Serif } from 'next/font/google';
import './globals.css';
import SiteAnalytics from './SiteAnalytics';
const body = DM_Sans({ variable: '--font-body', subsets: ['latin'] });
const display = Instrument_Serif({ variable: '--font-display', weight: '400', subsets: ['latin'] });
export const metadata: Metadata = {
  metadataBase: new URL('https://sitebrief-circuitstudio.vercel.app'),
  applicationName: 'Sitebrief',
  title: 'Sitebrief | Find areas for your restaurant',
  description: 'Explore city taste patterns, find areas worth scouting, and compare restaurant locations with visible evidence.',
  alternates: { canonical: '/' },
  openGraph: {
    siteName: 'Sitebrief', title: 'Sitebrief | Find areas for your restaurant',
    description: 'Restaurant scouting with Qloo taste evidence, source links and practical checks.',
    url: '/', type: 'website',
  },
};
export default function RootLayout({ children }: LayoutProps<'/'>) { return <html lang="en" className={`${body.variable} ${display.variable}`}><body>{children}<SiteAnalytics enabled={process.env.VERCEL_ENV==='production'}/></body></html>; }
