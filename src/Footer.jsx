/* global React */

// Render a string with "\n" line breaks as <br/>-separated lines.
function lines(text) {
  return String(text).split('\n').map((ln, i) => (
    <React.Fragment key={i}>{i > 0 && <br />}{ln}</React.Fragment>
  ));
}

function Footer() {
  const f = (window.SB_CONTENT && window.SB_CONTENT.footer) || {};
  const b = (window.SB_CONTENT && window.SB_CONTENT.business) || {};
  const name = b.name || 'Sagebrush Cycle';
  const phoneDisplay = b.phoneDisplay || '(208) 555-0148';
  const phoneHref = b.phoneHref || '+12085550148';
  const email = b.email || 'hello@sagebrushcycle.co';
  return (
    <footer className="sb-footer">
      <img className="sb-footer__ridge" src={`${ASSETS}/ridge.svg`} alt="" aria-hidden="true" />
      <div className="sb-footer__inner">
        <img className="sb-footer__mark" src={`${ASSETS}/emblem.svg`} alt={name} />
        <div className="sb-footer__cols">
          <div className="sb-footer__col">
            <h4>{f.findTitle || 'Find us'}</h4>
            <p>{lines(f.findBody || 'Weiser Trailhead\nby the river bridge')}</p>
          </div>
          <div className="sb-footer__col">
            <h4>{f.openTitle || 'Open'}</h4>
            <p>{lines(f.openBody || 'Thu–Mon · 8am–6pm\nClosed Tue & Wed')}</p>
          </div>
          <div className="sb-footer__col">
            <h4>{f.sayTitle || 'Say hi'}</h4>
            <p>
              <a href={`tel:${phoneHref}`}>{phoneDisplay}</a><br />
              <a href={`mailto:${email}`}>{email}</a>
            </p>
          </div>
        </div>
        <p className="sb-footer__note">{f.note || "Happy trails — we're wheely grateful you rolled by."}</p>
      </div>
    </footer>
  );
}

window.Footer = Footer;
