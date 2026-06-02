/* global React */

function Header() {
  const b = (window.SB_CONTENT && window.SB_CONTENT.business) || {};
  const name = b.name || 'Sagebrush Cycle';
  const tagline = b.tagline || 'BIKE RENTALS · WEISER TRAIL';
  const phoneDisplay = b.phoneDisplay || '(208) 555-0148';
  const phoneHref = b.phoneHref || '+12085550148';
  return (
    <header className="sb-header">
      <a className="sb-brand" href="#top">
        <img className="sb-brand__mark" src={`${ASSETS}/emblem.svg`} alt={`${name} emblem`} />
        <span className="sb-brand__text">
          {name}
          <small>{tagline}</small>
        </span>
      </a>
      <a className="sb-header__phone" href={`tel:${phoneHref}`}>
        <i data-lucide="phone"></i>
        <span>{phoneDisplay}</span>
      </a>
    </header>
  );
}

window.Header = Header;
