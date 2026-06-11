/* global React, Header, Hero, Rates, RentalForm, Footer, TrailInfo */

function App() {
  const formRef = React.useRef(null);
  const [page, setPage] = React.useState(window.location.hash === '#trail' ? 'trail' : 'home');

  React.useEffect(() => {
    const handleHashChange = () => {
      setPage(window.location.hash === '#trail' ? 'trail' : 'home');
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  React.useEffect(() => { if (window.lucide) window.lucide.createIcons(); });

  const scrollToForm = () => {
    if (page !== 'home') {
      window.location.hash = '';
      // The hashchange listener will set page to 'home' and scroll to top.
      // We need to wait for the next tick to scroll to the form.
      setTimeout(() => {
        const el = document.getElementById('reserve');
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY - 16;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }, 100);
      return;
    }
    const el = formRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 16;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  return (
    <div className="sb-page">
      <Header />
      <main>
        {page === 'home' ? (
          <React.Fragment>
            <Hero onReserve={scrollToForm} />
            <Rates />
            <div id="reserve">
              <RentalForm formRef={formRef} />
            </div>
          </React.Fragment>
        ) : (
          <TrailInfo onReserve={scrollToForm} />
        )}
      </main>
      <Footer />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
