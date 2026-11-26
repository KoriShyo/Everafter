# Everafter

**Everafter Studio** — design personalised wedding invitations, hand them to the wedding owner, and let them send every guest a link that greets them by name.

## Features

- Guided flow: Wedding details → Choose design → Customize → Send to wedding owner
- Visual editor with live desktop/mobile preview, undo, and design controls (colours, font pairs, background, photo crop, section order)
- 8 templates: Modern Romance, Ivory Classic, Garden Veil, Royal Khmer, Starlight, Golden Deco, Blush Portrait, Cinema Love
- Animated envelope opening (wax seal, folding flap, card push-in), photo-first covers, scroll-revealed sections, photo gallery with full-screen viewer
- English / Khmer: interface, invitation labels, Khmer dates and numerals, and owner-typed text in both languages; guests can switch language
- Wedding owner link: the couple adds guest names and sends each guest a personal link (Telegram, SMS, share, copy) and tracks who has been sent
- Respects `prefers-reduced-motion`

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5181 (the dev server also listens on your local network so you can open it from a phone on the same Wi-Fi).

## Build

```bash
npm run build
```

The static site is written to `dist/`.

## Note

This version is a frontend prototype: invitations, guests and links are stored in the browser's `localStorage`. Links are labelled as demo previews and only open on the device where the invitation was created. Sharing across devices needs a hosted backend.
