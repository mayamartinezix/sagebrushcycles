/* global React */

const RATES_FALLBACK = [
  {
    icon: 'sun',
    name: 'Half day',
    price: '$24',
    unit: 'up to 4 hours',
    desc: 'Just right for an easy out-and-back along the river. No spokes about it.',
  },
  {
    icon: 'bike',
    name: 'Full day',
    price: '$38',
    unit: 'all day, your pace',
    desc: 'Ride the whole trail and stop wherever looks good. Go on, gear out.',
    popular: true,
  },
  {
    icon: 'car',
    name: 'Bike rack',
    price: '+ $20',
    unit: 'adventures everywhere you go',
    desc: 'Need a great rack? We can handle that for you.', 
    
  },
];

function Rates() {
  const c = (window.SB_CONTENT && window.SB_CONTENT.rates) || {};
  const items = (c.items && c.items.length) ? c.items : RATES_FALLBACK;
  return (
    <section className="sb-rates" id="rates">
      <h2 className="sb-section__title">{c.title || "Rates that won't tire you out"}</h2>
      <p className="sb-section__sub">{c.sub || "Helmet, lock, and a little trail map come with every bike — that's just how we roll."}</p>
      <div className="sb-rates__grid">
        {items.map((r) => (
          <div className={`sb-rate${r.popular ? ' is-popular' : ''}`} key={r.name}>
            {r.popular && <span className="sb-rate__tag">The wheel deal</span>}
            <img className="sb-rate__icon" src={`${ASSETS}/${r.icon}.svg`} alt="" />
            <h3 className="sb-rate__name">{r.name}</h3>
            <p className="sb-rate__price">{r.price}<span> / {r.unit}</span></p>
            <p className="sb-rate__desc">{r.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

window.Rates = Rates;
