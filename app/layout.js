import './globals.css';

export const metadata = {
  title: 'Mechwart Tippverseny',
  description: 'Tippelj a Mechwart Esport Bajnokság CS2 és LoL meccseire, gyűjtsd a pontokat, és legyél te a Tippkirály!',
};

export const viewport = { themeColor: '#060a14', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="hu">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div className="bg" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
