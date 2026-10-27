// Teste Arbore 2.0.1: explicațiile pentru importul prin GEDCOM (FamilySearch / MyHeritage), indicația PDF, limita „documente atașate”.
// Rulare: node tests/help-import.test.mjs
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
const require = createRequire('/opt/node-tools/package.json');
const {chromium} = require('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const URL_APP = pathToFileURL(path.join(here, '..', 'index.html')).href;
let pass = 0, fail = 0;
function ok(name, cond, extra) { if (cond) { pass++; console.log('  ok   ' + name); } else { fail++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium'});
const ctx = await browser.newContext({viewport: {width: 1280, height: 900}, locale: 'ro-RO'});
const net = []; await ctx.route(/^https?:/, r => { net.push(r.request().url()); r.abort(); });
const page = await ctx.newPage(); const errors = [];
page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.addInitScript(() => { document.addEventListener('securitypolicyviolation', e => { (window.__csp = window.__csp || []).push(e.violatedDirective); }); });
await page.goto(URL_APP); await page.waitForFunction(() => document.documentElement.dataset.ready === '1');
await page.click('#nav [data-tab=data], [data-tab=data]');
const langs = ['ro', 'en', 'fr', 'it', 'es', 'pt', 'hu', 'de'];
for (const l of langs) {
  await page.selectOption('#lang', l); await page.waitForTimeout(100);
  const r = await page.evaluate(() => {
    const d = document.querySelector('#imp-src'); const ps = [...d.querySelectorAll('p')].map(p => p.textContent);
    const hints = [...document.querySelectorAll('[data-i18n=pdf_hint]')].map(p => p.textContent);
    const lim = [...document.querySelectorAll('#limits li')].map(li => li.textContent);
    return {sum: d.querySelector('summary').textContent, ps, hints, lim};
  });
  ok(l + ': panou import cu 4 paragrafe fără chei goale', r.ps.length === 4 && r.ps.every(x => x.length > 40 && !/^imp_src/.test(x)), r.ps.map(x => x.slice(0, 20)));
  ok(l + ': menționează GEDCOM, MyHeritage și FamilySearch', /GEDCOM/.test(r.ps.join(' ')) && /MyHeritage/.test(r.ps.join(' ')) && /FamilySearch/.test(r.ps.join(' ')));
  ok(l + ': nu pretinde test pe export real', !/testat cu succes|certified|certificat/i.test(r.ps.join(' ')));
  ok(l + ': 2 indicații PDF și 10 limite', r.hints.length === 2 && r.hints.every(h => /PDF/.test(h)) && r.lim.length === 10, [r.hints.length, r.lim.length]);
}
ok('0 erori JS, 0 violări CSP, 0 cereri de rețea', errors.length === 0 && !(await page.evaluate(() => window.__csp || [])).length && net.length === 0, {errors, net});
await browser.close();
console.log(`\n${pass} reușite, ${fail} eșuate`); process.exit(fail ? 1 : 0);
