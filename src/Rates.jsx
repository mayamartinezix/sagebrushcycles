/* global React */

const RATES = [
  {
    icon: 'sun',
    name: 'Half day',
    price: '$45',
    unit: 'up to 4 hours',
    desc: 'Just right for an easy out-and-back along the river. No spokes about it.',
    tag: 'No Need To Brake The Bank',
  },
  {
    icon: 'bike',
    name: 'Full day',
    price: '$60',
    unit: 'all day, your pace',
    desc: 'Ride the whole trail and stop wherever looks good. Go on, gear out.',
    tag: 'The Wheel Deal',
  },
  {
    icon: 'car',
    name: 'Shuttle service',
    price: '$20-$40',
    unit: 'adventures anywhere you want',
    desc: 'We go the extra mile.',
    
  },
];

<div className="sb-rates__grid">
        {RATES.map((r) => 
  (
          <div className={`sb-rate ${r.tag ? 'has-tag' : ''}`} key={r.name}>
            
            {r.tag && <span className="sb-rate__tag">{r.tag}</span>}
            
            <img className="sb-rate__icon" src={`${ASSETS}/${r.icon}.svg`} alt="" />
            <h3 className="sb-rate__name">{r.name}</h3>
            <p className="sb-rate__price">{r.price}<span> / {r.unit}</span></p>
            <p className="sb-rate__desc">{r.desc}</p>
          </div>
        )
                  )
        }
      </div>
    </section>
  );
}

window.Rates = Rates;
