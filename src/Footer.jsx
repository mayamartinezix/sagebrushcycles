/* global React */

function Footer() {
  return (
    <footer className="sb-footer">
      <img className="sb-footer__ridge" src={`${ASSETS}/ridge.svg`} alt="" aria-hidden="true" />
      <div className="sb-footer__inner">
        <img className="sb-footer__mark" src={`${ASSETS}/emblem.svg`} alt="Sagebrush Cycle" />
        <div className="sb-footer__cols">
          <div className="sb-footer__col">
            <h4>Find us</h4>
            <p>Weiser Trailhead<br />by the river bridge</p>
          </div>
          <div className="sb-footer__col">
            <h4>Open</h4>
            <p>Open Every Day! <br /> By Appointment </p>
          </div>
          <div className="sb-footer__col">
            <h4>Say hi</h4>
            <p>
              <a href="tel:+12085499099">(208) 549 9099</a><br />
              <a href="mailto:hello@sagebrushcycle.co">hello@sagebrushcycle.co</a>
            </p>
          </div>
        </div>
        <p className="sb-footer__note">Happy trails — we're wheely grateful you rolled by.</p>
      </div>
    </footer>
  );
}

window.Footer = Footer;
