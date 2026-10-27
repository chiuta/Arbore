# Changelog — Arbore

Format: SemVer MAJOR.MINOR.PATCH. Date: AAAA-LL-ZZ.

## 2.1.0 — 2026-10-27

- **Documente atașate la persoane** (PDF, imagini JPEG/PNG/GIF/WebP, text simplu .txt). Secțiune nouă „Documente atașate” în fișa persoanei: atașare, descărcare, eliminare, previzualizare miniatură pentru imagini. Fișierele se păstrează într-un depozit separat din IndexedDB (`fff.arbore`, versiunea 2, depozitul `docs`); în arbore rămân doar metadate (id, nume, tip, mărime, dată), deci tipărirea, GEDCOM-ul și memoria arborelui nu cresc.
- **Limite clare:** 3 MB pe fișier, 10 pe persoană, 60 MB în total, plus verificarea spațiului liber raportat de browser (`navigator.storage.estimate`) și tratarea `QuotaExceededError`. Tipul se determină după conținut (semnături PDF/JPEG/PNG/GIF/WebP; text doar pentru `.txt` valid UTF-8 fără octeți nuli), nu după extensie sau tipul declarat.
- **Ce NU se întâmplă (documentat în aplicație și README):** documentele nu sunt criptate (nici când arborele este criptat; aplicația afișează un avertisment), nu intră în GEDCOM, nu sunt incluse în copia `.fff.json` (acolo rămân doar metadatele; după restaurare în alt browser apare „fișierul lipsește”) și nu sunt trimise nicăieri. Ștergerea persoanei nu șterge imediat fișierele (pentru a funcționa „Anulează”); butonul „Șterge fișierele orfane” din Date și export le elimină, iar „Șterge tot” golește și depozitul de documente. Persoanele mascate ca private la export nu poartă metadate de documente. La îmbinarea duplicatelor, documentele se unesc (în limita de 10).
- Texte noi în 8 limbi (traducerile fr, it, es, pt, hu, de sunt automate, neverificate de vorbitori nativi). Limita nr. 10 din aplicație și README rescrisă.
- Teste noi: `tests/docs.test.mjs`. PDF: neschimbat (Tipărește › Salvează ca PDF); nu s-a adăugat generator PDF propriu.

## 2.0.1 — 2026-10-27

Doar texte și documentație (fără modificări de logică, parsare sau stocare).

- **Import din FamilySearch și MyHeritage: doar prin GEDCOM.** Panou pliabil „Import din FamilySearch sau MyHeritage (prin GEDCOM)” în Date și export › Import (8 limbi) și secțiune în README. MyHeritage: pașii după un ghid terț (Filae): „Family tree” › „Manage trees” › „Export to GEDCOM” › „Begin the export”. FamilySearch: pagina FamilySearch Innovate precizează că exportul GEDCOM direct nu mai este acceptat (se folosesc aplicații partenere). **Nu am testat importul cu un export real** de la aceste servicii; compatibilitatea nu este garantată, iar testele folosesc fișiere GEDCOM scrise de noi.
- **PDF al arborelui:** indicație lângă „Tipărește” și lângă raportul tipăribil: „Tipărește” › destinație „Salvează ca PDF”. Se folosește CSS-ul de tipărire existent (inclusiv pe mai multe pagini la scara 1:1); aplicația nu are un generator PDF propriu.
- **Atașarea de documente/PDF: planificat, neimplementat.** Documentat ca limită nouă (a 10-a) în aplicație și README: stocarea documentelor în browser ar epuiza cota; nu există încă o variantă compactă. Rămân doar fotografiile mici; liniile OBJE din GEDCOM se păstrează la round-trip.
- README (8 limbi): „Stare: stabil”, „Offline: complet”. Metadate: `app.json`, `fff-info`, meta, constantele de versiune, SHA-256 canonic; hash-ul CSP al scriptului principal recalculat.
- Teste: nou `tests/help-import.test.mjs` (33 de verificări, 8 limbi); `tests/test.mjs` citește acum versiunea din `app.json`.

## 2.0.0 — 2026-10-26

Povestea unei persoane și verificarea/repararea fișierelor GEDCOM (vezi README).
