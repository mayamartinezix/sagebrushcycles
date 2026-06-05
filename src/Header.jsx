/* global React */

function Header() {
  return (
    <header className="sb-header">
      <a className="sb-brand" href="#top">
        <img className="sb-brand__mark" src={`${ASSETS}/emblem.svg`} alt="Sagebrush Cycle emblem" />
        <span className="sb-brand__text">
          Sagebrush Cycles
          <small>BIKE RENTALS · CAMBRIDGE </small>
        </span>
      </a>
      <a className="sb-header__phone" href="tel:+12085550148">
        <i data-lucide="phone"></i>
        <span>(208) 549 9099</span>
      </a>
    </header>
  );
}

window.Header = Header;
