import './globals.css'

export const metadata = {
  title: 'World Protein Day - Milky Mist',
  description: 'Calculate your daily protein requirement with Milky Mist',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
