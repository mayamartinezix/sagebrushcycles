/* global React, Header, Hero, Rates, RentalForm, Footer */
const { useRef, useEffect } = React;

function App() {
  const formRef = useRef(null);

  useEffect(() => { if (window.lucide) window.lucide.createIcons(); });

  const scrollToForm = () => {
    const el = formRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 16;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  return (
    <div className="sb-page">
      <Header />
      <main>
        <Hero onReserve={scrollToForm} />
        <Rates />
        <RentalForm formRef={formRef} />
      </main>
      <Footer />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
