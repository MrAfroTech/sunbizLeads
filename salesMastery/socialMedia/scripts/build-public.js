const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const scanPublic = path.join(root, '..', 'eCommerceSite', 'scan-and-scale', 'public');
const publicDir = path.join(root, 'public');
const linksSrc = path.join(root, 'links');
const siteCss = path.join(root, 'styles', 'site.css');
const iconSvg = path.join(root, 'icon.svg');
const bgDir = path.join(linksSrc, 'assets', 'backgrounds');

const ROOT_SLIDES = [
  'mdt1.jpeg',
  'md2.jpeg',
  'md3.jpeg',
  'md4.jpeg',
  'md5.jpeg',
  'stadium.jpg',
  'crowdflow.jpg',
  'bar.jpg',
  'bar2.jpg',
  'qsr.jpg',
  'microdownton.jpg',
  'foodtruck.jpg',
  'scanablewritband.jpg',
  'hotel.jpg',
];

if (!fs.existsSync(path.join(linksSrc, 'index.html'))) {
  console.error('Missing links source:', linksSrc);
  process.exit(1);
}
if (!fs.existsSync(siteCss) || !fs.existsSync(iconSvg)) {
  console.error('Missing styles/site.css or icon.svg in socialMedia/');
  process.exit(1);
}
if (!fs.existsSync(scanPublic)) {
  console.error('Missing scan-and-scale public:', scanPublic);
  process.exit(1);
}

fs.mkdirSync(bgDir, { recursive: true });

function copySlide(filename, srcDir) {
  const src = path.join(srcDir, filename);
  if (!fs.existsSync(src)) {
    console.warn('Skip missing slide:', filename);
    return null;
  }
  fs.copyFileSync(src, path.join(bgDir, filename));
  return filename;
}

const slideUrls = [];

ROOT_SLIDES.forEach(function (name) {
  if (copySlide(name, scanPublic)) {
    slideUrls.push('/links/assets/backgrounds/' + name);
  }
});

const pexelsDir = path.join(scanPublic, 'media', 'pexels');
if (fs.existsSync(pexelsDir)) {
  fs.readdirSync(pexelsDir)
    .filter(function (f) {
      return /\.(jpe?g|webp)$/i.test(f);
    })
    .sort()
    .forEach(function (name) {
      if (copySlide(name, pexelsDir)) {
        slideUrls.push('/links/assets/backgrounds/' + name);
      }
    });
}

fs.writeFileSync(
  path.join(bgDir, 'slides.json'),
  JSON.stringify({ slides: slideUrls }, null, 2) + '\n'
);

fs.rmSync(publicDir, { recursive: true, force: true });
fs.mkdirSync(publicDir, { recursive: true });

fs.cpSync(linksSrc, path.join(publicDir, 'links'), { recursive: true });
fs.mkdirSync(path.join(publicDir, 'styles'), { recursive: true });
fs.copyFileSync(siteCss, path.join(publicDir, 'styles', 'site.css'));
fs.copyFileSync(iconSvg, path.join(publicDir, 'icon.svg'));

fs.writeFileSync(
  path.join(publicDir, 'index.html'),
  `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0;url=/links/">
  <link rel="canonical" href="/links/">
  <title>Seamlessly Links</title>
</head>
<body>
  <p><a href="/links/">Open link hub</a></p>
</body>
</html>`
);

console.log('socialMedia/public ready (' + slideUrls.length + ' background slides)');
