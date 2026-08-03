# Core Run Website

Dieser Ordner ist das vollständige GitHub-Repository für die Core-Run-Website.

GitHub ist ab jetzt die einzige Quelle für Veröffentlichungen. Cloudflare baut und veröffentlicht automatisch nach jedem Push auf den Branch `main`. So wird verhindert, dass ein alter lokaler Ordner oder ein manueller Upload versehentlich eine neuere Version überschreibt.

## Einmalige Einrichtung

1. Erstelle bei GitHub ein leeres Repository, zum Beispiel `core-run-website`.
2. Lade **den gesamten Inhalt dieses Ordners** in das Repository. `package.json`, `wrangler.jsonc`, `public` und `scripts` müssen direkt auf der obersten Ebene liegen.
3. Öffne Cloudflare und gehe zu **Workers & Pages**.
4. Öffne den bestehenden Worker **bold-field-33a4**.
5. Gehe zu **Settings → Builds → Connect** und verbinde das GitHub-Repository.
6. Prüfe zuerst die oberste Ebene des GitHub-Repositories:

   - Siehst du dort direkt `package.json`, `wrangler.jsonc`, `public` und `scripts`, ist die **Root directory** `/`.
   - Siehst du dort nur den Ordner `CORE-RUN-GITHUB-UPLOAD`, ist die **Root directory** `CORE-RUN-GITHUB-UPLOAD`.

7. Verwende anschließend diese Einstellungen:

   - Production branch: `main`
   - Root directory: wie in Schritt 6 ermittelt
   - Build command: leer lassen
   - Deploy command: `npx wrangler deploy`

8. Speichere die Einstellungen und starte den fehlgeschlagenen Build erneut. Danach veröffentlicht jeder Push auf `main` die Website automatisch.

Wichtig: Der Worker heißt in `wrangler.jsonc` ebenfalls `bold-field-33a4`. Dieser Name muss laut Cloudflare mit dem bestehenden Worker übereinstimmen.

## Danach

Für jede Änderung gilt nur noch:

1. Dateien in diesem Repository ändern.
2. Änderung nach GitHub auf `main` pushen.
3. In Cloudflare unter **Deployments / Build history** prüfen, ob der Build grün ist.

Keine ZIP-Dateien und keine manuell gebauten `dist`-Ordner hochladen. Cloudflare veröffentlicht die geprüften statischen Dateien direkt aus `public`.

## Lokale Prüfung

```bash
npm install
npm test
npm run deploy:check
npm run dev
```

Die lokale Vorschau läuft anschließend auf `http://localhost:4173`.

## Verlässlichkeit

`npm test` prüft lokal, ob zentrale Dateien fehlen, alte Hero-Texte wieder auftauchen oder die beiden Scroll-Stories nicht mehr enthalten sind. Die Cloudflare-Veröffentlichung selbst benötigt keinen Build-Schritt mehr und ist dadurch weniger fehleranfällig.

## Fehler „Could not detect a directory containing static files"

Dieser Fehler bedeutet fast immer, dass Cloudflare im falschen Repository-Verzeichnis startet. Kontrolliere dann die **Root directory** anhand von Schritt 6. Im korrekten Root muss Cloudflare die Dateien `package.json` und `wrangler.jsonc` sowie den Ordner `public` sehen.
