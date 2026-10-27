// Teste Arbore 2.1.0: documente atașate (IndexedDB), limite, tip după conținut, descărcare, orfani, persistență.
// Rulare: node tests/docs.test.mjs
import {createRequire} from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath, pathToFileURL} from 'node:url';
const require = createRequire('/opt/node-tools/package.json');
const {chromium} = require('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const URL_APP = pathToFileURL(path.join(here, '..', 'index.html')).href;
let pass = 0, fail = 0;
function ok(name, cond, extra) { if (cond) { pass++; console.log('  ok   ' + name); } else { fail++; console.log('  FAIL ' + name + (extra !== undefined ? '  -> ' + JSON.stringify(extra) : '')); } }
const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium'});
const ctx = await browser.newContext({viewport: {width: 1280, height: 900}, locale: 'ro-RO', acceptDownloads: true});
const net = []; await ctx.route(/^https?:/, r => { net.push(r.request().url()); r.abort(); });
const page = await ctx.newPage(); const errors = [];
page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.addInitScript(() => { document.addEventListener('securitypolicyviolation', e => { (window.__csp = window.__csp || []).push(e.violatedDirective); }); });
const ready = async () => { await page.goto(URL_APP); await page.waitForFunction(() => document.documentElement.dataset.ready === '1'); };
await ready();
await page.evaluate(() => document.querySelector('#b-sample').click()); await page.waitForTimeout(500);
const pid = await page.evaluate(() => { const ids = Object.keys(window.Arbore.db.persons); return ids[0]; });
await page.evaluate(id => { window.Arbore.S.sel = id; }, pid);
await page.evaluate(() => { selectPerson(Object.keys(DB.persons)[0], {reveal: true}); });
const toastText = async () => (await page.evaluate(() => { const t = document.querySelector('#toast, .toast'); return t ? t.textContent : ''; }));
const attach = async (name, buf) => { await page.setInputFiles('#doc-in', {name, mimeType: 'application/octet-stream', buffer: Buffer.isBuffer(buf) ? buf : Buffer.from(buf)}); await page.waitForTimeout(350); };
const docs = () => page.evaluate(id => (window.Arbore.db.persons[id].docs || []).map(d => ({...d})), pid);
// 1. PDF valid
const pdf = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.from('conținut de test '.repeat(50)), Buffer.from('\n%%EOF')]);
await attach('certificat.pdf', pdf);
let d = await docs();
ok('PDF valid atașat, tip determinat din conținut', d.length === 1 && d[0].type === 'application/pdf' && d[0].name === 'certificat.pdf' && d[0].size === pdf.length, d);
ok('fișa afișează documentul', (await page.textContent('#sheet')).includes('certificat.pdf'));
const dl = page.waitForEvent('download');
await page.click('#sheet [data-act=doc-dl]');
const dwn = await dl; const p1 = await dwn.path(); const got = fs.readFileSync(p1);
ok('descărcarea returnează exact aceiași octeți', got.equals(pdf) && dwn.suggestedFilename() === 'certificat.pdf');
// 2. respingeri
await attach('fals.pdf', 'acesta nu e PDF');
ok('„PDF” fals respins', (await docs()).length === 1);
await attach('program.exe', Buffer.from([0x4d, 0x5a, 0x90, 0, 3, 0, 0, 0]));
ok('executabil respins', (await docs()).length === 1);
await attach('gol.pdf', Buffer.alloc(0));
ok('fișier gol respins', (await docs()).length === 1);
await attach('mare.pdf', Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(3 * 1024 * 1024)]));
ok('fișier peste 3 MB respins', (await docs()).length === 1);
await attach('nota.txt', 'Notă de familie: ăâîșț\n');
d = await docs(); ok('text UTF-8 acceptat', d.length === 2 && d[1].type === 'text/plain');
await attach('binar.txt', Buffer.from([0x41, 0, 0x42]));
ok('„.txt” cu octeți nuli respins', (await docs()).length === 2);
// 3. imagine PNG + miniatură
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
await attach('foto.png', png);
await page.waitForSelector('#sheet .docprev img', {timeout: 3000});
ok('imaginea are miniatură (blob:), fără încălcări CSP', (await page.getAttribute('#sheet .docprev img', 'src')).startsWith('blob:'));
ok('tip PNG după semnătură', (await docs())[2].type === 'image/png');
// 4. limita de 10 pe persoană
for (let i = 0; i < 9; i++) await attach('x' + i + '.txt', 'text ' + i);
d = await docs(); ok('maximum 10 documente pe persoană', d.length === 10, d.length);
// 5. persistență după reîncărcare
await page.evaluate(() => { window.Arbore.ST.dirty = true; });
await page.waitForTimeout(1500);
await ready();
await page.evaluate(id => selectPerson(id, {reveal: true}), pid);
d = await docs(); ok('metadatele persistă după reîncărcare', d.length === 10, d.length);
const dl2 = page.waitForEvent('download'); await page.click('#sheet [data-doc="' + d[0].id + '"][data-act=doc-dl]');
ok('fișierul persistă (IndexedDB) după reîncărcare', fs.readFileSync(await (await dl2).path()).equals(pdf));
// 6. eliminare
const before = await page.evaluate(() => docsList().then(l => l.length));
await page.click('#sheet [data-doc="' + d[1].id + '"][data-act=doc-rm]'); await page.waitForTimeout(200);
await page.click('dialog[open] .danger, dialog[open] button.primary'); await page.waitForTimeout(500);
const after = await page.evaluate(() => docsList().then(l => l.length));
ok('eliminarea șterge și fișierul din IndexedDB', after === before - 1 && (await docs()).length === 9, [before, after]);
// 7. orfani: ștergerea persoanei + curățare
await page.evaluate(id => { deletePerson(DB, id); }, pid);
const n = await page.evaluate(() => docsSweep());
ok('curățarea elimină fișierele orfane', n === 9 && (await page.evaluate(() => docsList().then(l => l.length))) === 0, n);
// 8. funcții pure
const pure = await page.evaluate(() => {
  const db = {persons: {a: {docs: [{size: 59 * 1048576}]}}}, p = {docs: []};
  const r = {};
  r.total = docCheck(db, p, 2 * 1048576, 'application/pdf');
  r.ok = docCheck({persons: {}}, p, 1000, 'application/pdf');
  r.type = docCheck({persons: {}}, p, 1000, '');
  r.size = docCheck({persons: {}}, p, DOC_MAX + 1, 'application/pdf');
  r.cnt = docCheck({persons: {}}, {docs: new Array(10).fill(1)}, 10, 'application/pdf');
  r.clean = cleanDocs([{id: 'd0123456789ab', name: '../../etc/passwd\u0000', type: 'application/pdf', size: 5, added: '2026-10-27'}, {id: '../x', type: 'application/pdf'}, {id: 'd0123456789ab', type: 'application/pdf'}, {id: 'd0123456789ac', type: 'text/html'}, null, 'x']);
  r.cleanAll = cleanDocs('nu e listă');
  return r;
});
ok('limita totală / tip / mărime / număr', pure.total === 'docs_err_total' && pure.ok === '' && pure.type === 'docs_err_type' && pure.size === 'docs_err_size' && pure.cnt === 'docs_err_count', pure);
ok('cleanDocs: nume curățat, id invalid/duplicat/tip străin eliminate', pure.clean.length === 1 && !/[\\/\u0000]/.test(pure.clean[0].name) && pure.cleanAll.length === 0, pure.clean);
// 9. limbi
await page.evaluate(() => document.querySelector('#b-sample').click()); await page.waitForTimeout(400);
for (const l of ['ro', 'en', 'fr', 'it', 'es', 'pt', 'hu', 'de']) {
  await page.selectOption('#lang', l); await page.waitForTimeout(100);
  await page.evaluate(() => selectPerson(Object.keys(DB.persons)[0], {reveal: true}));
  const t = await page.evaluate(() => ({s: (document.querySelector('#sheet [data-act=doc-add]') || {}).textContent, lim: [...document.querySelectorAll('#limits li')].map(x => x.textContent)[9] || ''}));
  ok(l + ': butonul și limita nr. 10 sunt traduse, fără chei brute', t.s && !/^docs_/.test(t.s) && t.lim.length > 80 && /3 MB|3 Mo/.test(t.lim), t);
}
// 10. avertisment criptare
await page.selectOption('#lang', 'en');
const warn = await page.evaluate(() => { ST.enc = true; renderSheet(); const t = document.querySelector('#sheet').textContent; ST.enc = false; return /NOT encrypted/.test(t); });
ok('avertisment: documentele nu sunt criptate când arborele e criptat', warn);
// 11. ștergere totală
await page.evaluate(async () => { const p = DB.persons[Object.keys(DB.persons)[0]]; await docPut('d0123456789ab', new Blob(['x'])); });
await page.evaluate(() => docsClearAll());
ok('docsClearAll golește depozitul', (await page.evaluate(() => docsList().then(l => l.length))) === 0);
ok('0 erori JS, 0 violări CSP, 0 cereri de rețea', errors.length === 0 && !(await page.evaluate(() => window.__csp || [])).length && net.length === 0, {errors, net, csp: await page.evaluate(() => window.__csp || [])});
await browser.close();
console.log(`\n${pass} reușite, ${fail} eșuate`); process.exit(fail ? 1 : 0);
