import { GALLERY_IMAGES, GALLERY_IMAGE_COUNT } from '../data/galleryImages';

export default function Gallery() {
  return (
    <div className="gallery-page">
      <header className="gallery-header">
        <a className="gallery-back" href="/">← Home</a>
        <div className="gallery-brand">Strike After Dark</div>
        <div className="gallery-rule" aria-hidden="true">
          <span className="ln" />
          <span className="diamond" />
          <span className="ln r" />
        </div>
        <h1 className="gallery-title">Gallery</h1>
        <p className="gallery-sub">
          Nights at The Alley · {GALLERY_IMAGE_COUNT} moments
        </p>
      </header>

      <div className="gallery-grid" role="list">
        {GALLERY_IMAGES.map((src, index) => (
          <figure className="gallery-item" role="listitem" key={src}>
            <img
              className="gallery-img"
              src={src}
              alt={`Strike After Dark gallery image ${index + 1}`}
              loading={index < 6 ? 'eager' : 'lazy'}
              decoding="async"
            />
          </figure>
        ))}
      </div>

      <footer className="gallery-footer">
        <div className="fw">STRIKE AFTER DARK</div>
        <a href="/">Back to home</a>
      </footer>
    </div>
  );
}
