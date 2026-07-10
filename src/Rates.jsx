/* global React */


const RATES = [
  {
    icon: 'bike',
    name: 'Half-day',
    price: '$45',
    unit: 'up to 4 hours',
    desc: 'Just right for an easy out-and-back along the river. No spokes about it.',
    tag: 'No Need To Brake The Bank',
  },
  {
    icon: 'bike',
    name: 'Full-day',
    price: '$65',
    unit: 'all day, your pace',
    desc: 'Ride the whole trail and stop wherever looks good. Go on, gear out.',
  },
  {
    icon: 'car',
    name: 'Shuttle Service',
    price: '$25 + milage cost',
    desc: 'We go the extra mile.',
  },
  
];

function Rates() {
  // Dynamically split the rates array based on functionality
  const bikeRates = RATES.filter(r => r.icon === 'bike');
  const shuttleRates = RATES.filter(r => r.icon === 'car' || r.icon === 'CutePhone');

  // Helper function to render an individual rate card to keep code DRY
  const renderCard = (r) => (
    <div className={`sb-rate ${r.tag ? 'has-tag' : ''}`} key={r.name}>
      {r.tag && <span className="sb-rate__tag">{r.tag}</span>}
      <img className="sb-rate__icon" src={`${ASSETS}/${r.icon}.svg`} alt="" />
      <h3 className="sb-rate__name">{r.name}</h3>
      <p className="sb-rate__price">{r.price}{r.unit ? <span> / {r.unit}</span> : null}</p>
      <p className="sb-rate__desc">{r.desc}</p>
    </div>
  );

  return (
    <section className="sb-rates" id="rates">
      <h2 className="sb-section__title">Rates that won't tire you out</h2>
      <p className="sb-section__sub">Helmet, lock, and a little trail map come with every e-bike — that's just how we roll.</p>

      {/* E-bike Rental Section */}
      <div className="sb-rates__section" style={{ marginBottom: '3rem' }}>
        <h3 className="sb-rates__group-title" style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'inherit' }}>
          E-bike Rentals
        </h3>
        <div className="sb-rates__grid">
          {bikeRates.map(renderCard)}
        </div>
      </div>

      {/* Shuttle Service Section */}
      <div className="sb-rates__section">
        <h3 className="sb-rates__group-title" style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'inherit' }}>
          Shuttle Service
        </h3>
        <div className="sb-rates__grid">
          {shuttleRates.map(renderCard)}
        </div>
      </div>
    </section>
  );
}

window.Rates = Rates;
