/* global React */

function Hero({ onReserve }) {
  const c = (window.SB_CONTENT && window.SB_CONTENT.hero) || {};
  const b = (window.SB_CONTENT && window.SB_CONTENT.business) || {};
  const phoneHref = b.phoneHref || '+12085550148';
  return (
    <section className="sb-hero" id="top">
      <div className="sb-hero__sun" aria-hidden="true">
        <img src={`${ASSETS}/sun.svg`} alt="" />
      </div>
      <p className="sb-hero__eyebrow">{c.eyebrow || "WE'RE WHEELY GLAD YOU'RE HERE"}</p>
      <h1 className="sb-hero__title">
        {c.titleLine1 || 'Easygoing bike rentals,'}<br />{c.titleLine2 || 'right by the trail.'}
      </h1>
      <p className="sb-hero__lead">
        {c.lead || "Grab a comfy bike for a half day or a full day and roll straight out onto the Weiser Trail. Two wheels, zero worries — just tell us when you'd like to ride and we'll have one ready to roll."}
      </p>
      <div className="sb-hero__cta">
        <Button variant="primary" onClick={onReserve}>{c.ctaPrimary || 'Saddle up'}</Button>
        <a className="sb-hero__link" href={`tel:${phoneHref}`}>
          <i data-lucide="phone"></i> {c.ctaPhone || 'Or give us a call'}
        </a>
      </div>

      <div className="sb-hero__photo">
        <span className="sb-hero__badge">{c.badge || 'Hop on!'}</span>
        {/* The hero photo. To change it, replace src/assets/hero.jpg with a new
            photo of the same name and rebuild — see README. */}
        <image-slot
          id="sb-hero-photo"
          shape="rounded"
          radius="24"
          src="assets/hero.jpg"
          placeholder="Drop a golden-hour trail photo"
        ></image-slot>
        <img className="sb-hero__bike" src={`${ASSETS}/bike.svg`} alt="" aria-hidden="true" />
      </div>
    </section>
  );
}

window.Hero = Hero;
