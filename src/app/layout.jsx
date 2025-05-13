import '../styles/globals.css';

export const metadata = {
  title: 'Neural Network Layout',
  description: 'Animation d’un réseau de neurones',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}