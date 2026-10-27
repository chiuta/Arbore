# Changelog — Arbore

Format: SemVer MAJOR.MINOR.PATCH. Date: AAAA-LL-ZZ.

## 2.0.1 — 2026-10-27

Doar texte și documentație (fără modificări de logică, parsare sau stocare).

- **Import din FamilySearch și MyHeritage: doar prin GEDCOM.** Panou pliabil „Import din FamilySearch sau MyHeritage (prin GEDCOM)” în Date și export › Import (8 limbi) și secțiune în README. MyHeritage: pașii după un ghid terț (Filae): „Family tree” › „Manage trees” › „Export to GEDCOM” › „Begin the export”. FamilySearch: pagina FamilySearch Innovate precizează că exportul GEDCOM direct nu mai este acceptat (se folosesc aplicații partenere). **Nu am testat importul cu un export real** de la aceste servicii; compatibilitatea nu este garantată, iar testele folosesc fișiere GEDCOM scrise de noi.
- **PDF al arborelui:** indicație lângă „Tipărește” și lângă raportul tipăribil: „Tipărește” › destinație „Salvează ca PDF”. Se folosește CSS-ul de tipărire existent (inclusiv pe mai multe pagini la scara 1:1); aplicația nu are un generator PDF propriu.
- **Atașarea de documente/PDF: planificat, neimplementat.** Documentat ca limită nouă (a 10-a) în aplicație și README: stocarea documentelor în browser ar epuiza cota; nu există încă o variantă compactă. Rămân doar fotografiile mici; liniile OBJE din GEDCOM se păstrează la round-trip.
- README (8 limbi): „Stare: stabil”, „Offline: complet”. Metadate: `app.json`, `fff-info`, meta, constantele de versiune, SHA-256 canonic; hash-ul CSP al scriptului principal recalculat.
- Teste: nou `tests/help-import.test.mjs` (33 de verificări, 8 limbi); `tests/test.mjs` citește acum versiunea din `app.json`.

## 2.0.0 — 2026-10-26

Povestea unei persoane și verificarea/repararea fișierelor GEDCOM (vezi README).
