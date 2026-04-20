import { BaseDirectory, readFile, readTextFile } from "@tauri-apps/plugin-fs"
import { zipSync } from "fflate"
import type { MobilenetClassifierMetadata } from "./storage"

function formatClassList(names: string[]): string {
  if (names.length === 0) return ""
  if (names.length === 1) return names[0]
  return (
    names
      .slice(0, -1)
      .map((name) => `<strong>${name}</strong>`)
      .join(", ") +
    " and " +
    `<strong>${names[names.length - 1]}</strong>`
  )
}

function buildStaticHtml(projectName: string, classNames: string[]): string {
  const classListJson = JSON.stringify(classNames)
  const escapedName = projectName.replace(/</g, "&lt;").replace(/>/g, "&gt;")
  const subtitle =
    classNames.length > 0
      ? `Predict: ${formatClassList(classNames)}`
      : "Image classifier"

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="color-scheme" content="dark light" />
<title>${escapedName}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/holiday.css" />
<script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.0/dist/mobilenet.min.js"></script>
<style>
  #drop { border: 2px dashed currentColor; border-radius: 4px; cursor: pointer; min-height: 10rem; display: flex; align-items: center; justify-content: center; transition: opacity .15s; overflow: hidden; }
  #drop:hover, #drop.over { opacity: .6; }
  #drop-hint { pointer-events: none; }
  #preview { display: none; max-width: 100%; max-height: 380px; width: 100%; object-fit: contain; }
  #file-in { display: none; }
  .row { display: grid; grid-template-columns: 8rem 1fr 3.5rem; align-items: center; gap: .5rem; margin: .3rem 0; }
  .row meter { width: 100%; }
  .row small { text-align: right; }
</style>
</head>
<body>
<header>
  <h1>${escapedName}</h1>
  <p>${subtitle}</p>
</header>
<main>
  <section id="loading">
    <h3>Setting up app…</h3>
    <ul>
      <li id="s-tf">TF.js backend…</li>
      <li id="s-mn">MobileNet…</li>
      <li id="s-cl">Classifier…</li>
    </ul>
  </section>
  <section id="app" hidden>
    <input type="file" accept="image/*" id="file-in" />
    <div id="drop">
      <p id="drop-hint">Drop an image here or <strong>click to upload</strong></p>
      <img id="preview" hidden alt="preview" />
    </div>
    <section id="results" hidden></section>
  </section>
</main>

<script>
const CLASS_NAMES = ${classListJson};
let mn = null, cl = null;

async function init() {
  await tf.ready();
  mark('s-tf', 'TF.js \u2713');
  mn = await mobilenet.load({ version: 2, alpha: 1 });
  mark('s-mn', 'MobileNet \u2713');
  cl = await tf.loadLayersModel('model.json');
  mark('s-cl', 'Classifier \u2713');
  document.getElementById('loading').hidden = true;
  document.getElementById('app').hidden = false;
}

function mark(id, text) {
  document.getElementById(id).textContent = text;
}

async function predict(imgEl) {
  const embedding = tf.tidy(() => {
    const t = tf.browser.fromPixels(imgEl);
    const r = tf.image.resizeBilinear(t, [224, 224]);
    return mn.infer(r.expandDims(0), true).squeeze();
  });
  const probs = tf.tidy(() =>
    Array.from(cl.predict(embedding.expandDims(0)).dataSync())
  );
  embedding.dispose();

  const sorted = CLASS_NAMES
    .map((name, i) => ({ name, p: probs[i] ?? 0 }))
    .sort((a, b) => b.p - a.p);

  const sec = document.getElementById('results');
  sec.hidden = false;
  sec.innerHTML = '<h2>' + sorted[0].name + ' \u2014 ' + pct(sorted[0].p) + '</h2>' +
    sorted.map(({ name, p }) =>
      '<div class="row"><span>' + esc(name) + '</span>' +
      '<meter value="' + p.toFixed(4) + '" min="0" max="1"></meter>' +
      '<small>' + pct(p) + '</small></div>'
    ).join('');
}

function pct(v) { return Math.round(v * 100) + '%'; }
function esc(s) { return s.replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function loadFile(file) {
  const hint = document.getElementById('drop-hint');
  const img = document.getElementById('preview');
  const reader = new FileReader();
  reader.onload = (e) => {
    img.onload = () => {
      hint.hidden = true;
      img.hidden = false;
      document.getElementById('results').hidden = true;
      void predict(img);
    };
    img.style.display = 'block';
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

const drop = document.getElementById('drop');
const fileIn = document.getElementById('file-in');
drop.addEventListener('click', (e) => { if (e.target !== fileIn) fileIn.click(); });
fileIn.addEventListener('change', (e) => { if (e.target.files[0]) loadFile(e.target.files[0]); });
drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
drop.addEventListener('dragleave', () => drop.classList.remove('over'));
drop.addEventListener('drop', (e) => {
  e.preventDefault();
  drop.classList.remove('over');
  if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]);
});

init().catch((err) => {
  document.getElementById('loading').innerHTML = '<p><strong>Error:</strong> ' + err.message + '</p>';
});
</script>
</body>
</html>
`
}

export async function exportModelAsZip(
  artifactPath: string,
  fileName: string,
): Promise<void> {
  const [modelJsonText, metadataText, weightBytes] = await Promise.all([
    readTextFile(`${artifactPath}/model.json`, {
      baseDir: BaseDirectory.AppData,
    }),
    readTextFile(`${artifactPath}/metadata.json`, {
      baseDir: BaseDirectory.AppData,
    }),
    readFile(`${artifactPath}/weights.bin`, { baseDir: BaseDirectory.AppData }),
  ])

  const metadata = JSON.parse(metadataText) as MobilenetClassifierMetadata
  const classNames = metadata.classNames ?? []
  const indexHtml = buildStaticHtml(fileName, classNames)

  const zipped = zipSync({
    "model.json": new TextEncoder().encode(modelJsonText),
    "metadata.json": new TextEncoder().encode(metadataText),
    "weights.bin": weightBytes,
    "index.html": new TextEncoder().encode(indexHtml),
  })

  const blob = new Blob([zipped as any], { type: "application/zip" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${fileName}.zip`
  a.click()
  URL.revokeObjectURL(url)
}
