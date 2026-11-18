// Builds the static site from src/ into public/.
// Usage: node build.mjs
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync, copyFileSync } from "node:fs";
import { join, dirname, relative } from "node:path";

const SRC = "src", OUT = "public", SITE = "https://notlike.us";
const header = readFileSync(join(SRC, "partials/header.html"), "utf8");
const footer = readFileSync(join(SRC, "partials/footer.html"), "utf8").replaceAll("{{year}}", String(new Date().getFullYear()));
const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const walk = (dir) => readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : [p]; });

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const urls = [];
function page(rel, meta, body) {
  const path = "/" + rel.replace(/index\.html$/, "").replace(/\.html$/, "");
  const html = header
    .replaceAll("{{title}}", esc(meta.title))
    .replaceAll("{{description}}", esc(meta.description))
    .replaceAll("{{path}}", path === "/404" ? "/" : path) + body + footer;
  const out = join(OUT, rel);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
  if (path !== "/404") urls.push(path);
}

// Hand-written pages: the first line is <!--meta {"title": ..., "description": ...} -->
for (const file of walk(join(SRC, "pages"))) {
  const rel = relative(join(SRC, "pages"), file).replace(/\\/g, "/");
  const body = readFileSync(file, "utf8");
  const m = body.match(/^<!--meta (\{.*\}) -->\n?/);
  if (!m) throw new Error(`Missing meta line in ${rel}`);
  page(rel, JSON.parse(m[1]), body.slice(m[0].length));
}

// Terms of Use and Privacy Policy come from the app's own text (src/legal.json),
// so the website and the app always say the same thing.
const legal = JSON.parse(readFileSync(join(SRC, "legal.json"), "utf8"));
const WEBSITE_NOTE = {
  heading: "This website",
  body: ["This website, notlike.us, does not use cookies, ads, or tracking, and it does not collect any information from you. If you email us, we use your email only to reply and, if you ask, to invite you to try the app."],
};
for (const [slug, doc] of Object.entries(legal)) {
  const sections = slug === "privacy" ? [...doc.sections, WEBSITE_NOTE] : doc.sections;
  const body = `<main class="wrap doc">
  <h1>${esc(doc.title)}</h1>
  <p class="updated">Last updated ${esc(doc.updated)}</p>
  <p>${esc(doc.intro)}</p>
${sections.map((s) => `  <h2>${esc(s.heading)}</h2>\n${s.body.map((p) => `  <p>${esc(p)}</p>`).join("\n")}`).join("\n")}
</main>
`;
  page(`${slug}.html`, { title: `${doc.title} | notlike.us`, description: `The notlike.us ${doc.title}.` }, body);
}

// Static files.
for (const file of walk(SRC)) {
  const rel = relative(SRC, file).replace(/\\/g, "/");
  if (rel.startsWith("pages/") || rel.startsWith("partials/") || rel === "legal.json") continue;
  mkdirSync(dirname(join(OUT, rel)), { recursive: true });
  copyFileSync(file, join(OUT, rel));
}

writeFileSync(join(OUT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.sort().map((u) => `  <url><loc>${SITE}${u}</loc></url>`).join("\n")}
</urlset>
`);
console.log(`Built ${urls.length} pages into ${OUT}/`);
