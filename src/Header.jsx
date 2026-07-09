/* global React */

function Header() {
  return (
    <header className="sb-header">
      <div className="sb-header__left">
        <a className="sb-brand" href="#">
          <img className="sb-brand__mark" src={`${ASSETS}/sagebrush.svg`} alt="Sagebrush Cycle logo" />
          <span className="sb-brand__text">
            Sagebrush Cycles
            <small>BIKE RENTALS · CAMBRIDGE </small>
          </span>
        </a>
      </div>
    </header>
  );
}

window.Header = Header;
