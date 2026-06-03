import "./globals.css";

export const metadata = {
  title: "Moveo — Anima tus productos con IA",
  description: "Subí una foto de tu producto y generá un video publicitario con IA.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800&family=Manrope:wght@400;500;600;700&family=Poppins:ital,wght@0,600;0,800;1,600&family=Lora:ital,wght@0,600;0,700;1,600&family=Playfair+Display:ital,wght@0,700;1,700&family=Montserrat:wght@600;800&family=Oswald:wght@600&family=Bebas+Neue&family=Anton&family=Pacifico&family=Dancing+Script:wght@700&family=Lobster&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
