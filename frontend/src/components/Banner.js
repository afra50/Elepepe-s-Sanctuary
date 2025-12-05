import React from "react";
import { Link } from "react-router-dom";
import Button from "./ui/Button";

function Banner({ image, title, text, ctaLabel, ctaLink }) {
  return (
    <div className="banner" style={{ backgroundImage: `url(${image})` }}>
      <div className="banner__overlay">
        <div className="banner__content">
          {title && <h1 className="banner__title">{title}</h1>}
          {text && <p className="banner__text">{text}</p>}

          {/* Renderujemy przycisk tylko jeśli przekazano label i link */}
          {ctaLabel && ctaLink && (
            <div className="banner__actions">
              <Link to={ctaLink}>
                <Button variant="accent" size="md">
                  {ctaLabel}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Banner;
