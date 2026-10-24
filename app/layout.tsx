import "./globals.css";

export const metadata = {
  title: "Academia Iron City",
  description: "Grade de aulas coletivas da Academia Iron City (GTA7 Lab)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <header>
          <a href="/" className="brand">🏋️ Academia Iron City</a>
          <span className="muted">GTA7 Lab</span>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
