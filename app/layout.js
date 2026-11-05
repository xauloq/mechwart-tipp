import '@fontsource-variable/inter';
import './globals.css';
import Cursor from '../components/Cursor';
import CookieNote from '../components/CookieNote';

export const metadata = {
  title: 'Mechwart Tippverseny',
  description: 'Tippelj a Mechwart Esport Bajnokság CS2 és LoL meccseire, gyűjtsd a pontokat, és legyél te a Tippkirály!',
};

export const viewport = { themeColor: '#060a14', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="hu">
      <body>
        <div className="bg" aria-hidden="true" />
        {children}
        <CookieNote />
        <Cursor />
      </body>
    </html>
  );
}
