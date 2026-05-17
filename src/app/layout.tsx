import type { Metadata } from 'next'
import { Dela_Gothic_One, Nunito } from 'next/font/google'
import { Providers } from '@/components/Providers'
import './globals.css'

const delaGothic = Dela_Gothic_One({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-dela',
})

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
})

export const metadata: Metadata = {
  title: 'MUDOBI — Free Mint',
  description: 'She is watching you. Mint your Mudobi NFT.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${delaGothic.variable} ${nunito.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
