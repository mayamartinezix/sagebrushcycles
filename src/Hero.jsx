/* global React */

function Hero({ onReserve }) {
  return (
    <section className="sb-hero" id="top">
      <div className="sb-hero__sun" aria-hidden="true">
        <img src={`${ASSETS}/sun.svg`} alt="" />
      </div>
      <p className="sb-hero__eyebrow">WE'RE WHEELY GLAD YOU'RE HERE</p>
      <h1 className="sb-hero__title">Easygoing bike rentals,<br />right by the trail.</h1>
      <p className="sb-hero__lead">
        Grab a comfy bike for a half day or a full day and roll straight out onto
        the Weiser Trail. Two wheels, zero worries — just tell us when you'd like
        to ride and we'll have one ready to roll.
      </p>
      <div className="sb-hero__cta">
        <div className="sb-hero__btns">
          <Button variant="primary" onClick={onReserve}>Saddle up</Button>
          <Button variant="secondary" onClick={() => { window.location.hash = 'trail'; }}>Weiser Trail Info</Button>
        </div>
      </div>
      <div className="sb-hero__photo">
        <span className="sb-hero__badge">Explore Natural Beauty</span>
        {/* The hero photo lives in src/assets/ — swap the file or change src below. */}
        <image-slot
          id="sb-hero-photo"
          shape="rounded"
          radius="24"
          src="assets/Mom%20Weiser%20jpg.jpg"
          placeholder="Drop a golden-hour trail photo"
        ></image-slot>
        <img className="sb-hero__bike" src={`${ASSETS}/bike.svg`} alt="" aria-hidden="true" />
      </div>
    </section>
  );
}

window.Hero = Hero;
