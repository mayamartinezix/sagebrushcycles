// 1. Define the Button at the top so TrailInfo can use it locally
function Button({ variant, onClick, children }) {
  const className = variant === 'primary' ? 'btn-primary' : 'btn-secondary';
  return (
    <button className={className} onClick={onClick}>
      {children}
    </button>
  );
}

// 2. Define your TrailInfo component
function TrailInfo({ onReserve }) {
  return (
    <div className="sb-trail-page">
      <section className="sb-trail-hero">
        <div className="sb-trail-hero__content">
          <p className="sb-hero__eyebrow">DISCOVER THE PATH LESS TRAVELED</p>
          <h1 className="sb-hero__title">The Weiser River Trail</h1>
          <p className="sb-hero__lead">
            Spanning 84 miles through the heart of Idaho, the Weiser River Trail is a
            National Recreation Trail that follows the historic Pacific and Idaho Northern
            railroad line. Starting right here in Cambridge, you're perfectly positioned
            to explore its most scenic stretches.
          </p>
          <div className="sb-hero__cta">
            <Button variant="primary" onClick={onReserve}>Reserve your ride</Button>
          </div>
        </div>
      </section>

      <section className="sb-trail-details">
        <div className="sb-trail-grid">
          <div className="sb-trail-card">
            <div className="sb-trail-card__icon">
              <i data-lucide="map-pin"></i>
            </div>
            <h3 className="sb-trail-card__title">The Cambridge Section</h3>
            <p className="sb-trail-card__text">
              Cambridge serves as a vital midpoint on the trail. Heading south takes you through
              the dramatic Weiser River Canyons toward Midvale, while heading north leads
              upward into the lush forests and meadows near Council.
            </p>
          </div>

          <div className="sb-trail-card">
            <div className="sb-trail-card__icon">
              <i data-lucide="rail-symbol"></i>
            </div>
            <h3 className="sb-trail-card__title">Historic Trestles</h3>
            <p className="sb-trail-card__text">
              The trail features 62 historic railroad trestles that have been converted for
              trail use. These wooden and steel structures provide stunning vantage points
              over the river and surrounding valleys.
            </p>
          </div>

          <div className="sb-trail-card">
            <div className="sb-trail-card__icon">
              <i data-lucide="mountain"></i>
            </div>
            <h3 className="sb-trail-card__title">Diverse Landscapes</h3>
            <p className="sb-trail-card__text">
              Experience Idaho's changing face: from open desert canyons and rolling
              farmland to dense evergreen forests and alpine meadows. Keep an eye out
              for local wildlife like bald eagles, deer, and elk.
            </p>
          </div>

          <div className="sb-trail-card">
            <div className="sb-trail-card__icon">
              <i data-lucide="info"></i>
            </div>
            <h3 className="sb-trail-card__title">Trail Tips</h3>
            <p className="sb-trail-card__text">
              The trail is unpaved (primarily gravel and dirt) but well-maintained.
              Our rental bikes are chosen specifically for these conditions to ensure
              a smooth and comfortable journey.
            </p>
          </div>
        </div>
      </section>

      <section className="sb-trail-cta">
        <div className="sb-trail-cta__card">
          <h2 className="sb-section__title">Ready to explore?</h2>
          <p className="sb-section__sub">
            Whether you're looking for a quick afternoon spin or a full day of adventure,
            we've got the gear and the advice to get you on your way.
          </p>
          <Button variant="secondary" onClick={() => window.location.hash = ''}>Back to home</Button>
        </div>
      </section>
    </div>
  );
}

// 3. Attach it globally so App.jsx can find it when building the page layout
window.TrailInfo = TrailInfo;
