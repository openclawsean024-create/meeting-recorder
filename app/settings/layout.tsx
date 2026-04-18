import Header from '../../components/Header';

export default function InnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="main-content" style={{ minHeight: 'calc(100vh - 64px)' }}>
        {children}
      </main>
    </>
  );
}
