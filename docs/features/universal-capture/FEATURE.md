# Universal capture home

Home is a single board. Users write, speak, or attach a file. The app decides what to save.

## Behaviour
- Writing, links, PDFs, photos, and blogs are all saved as **notes**.
- Search and filters then pick out what you asked for: `links` shows notes that contain URLs, `pdfs` shows notes that contain PDFs.
- **Alarms** and **reminders** stay separate.

Ordinary writing is saved as a note when you tap Save. Attachments and a bare URL also wait for Save, then land in Notes with the right blocks so search can find them later.

## Examples
- `create an alarm for 6:30 in the tommarow morning` → one-time alarm, 6:30 AM tomorrow.
- `mujhe kal 2 ghante book padna hai remind me in the morning` → reminder titled “Read Book (2 hours)” tomorrow at 8:00 AM.
- Paste `https://example.com/essay` → note that contains a link. Searching “links” lists it.
- Attach `Physics.pdf` → note with a PDF block. Searching “pdfs” lists it.

English, Hindi, and Hinglish are parsed on-device. Voice uses device speech recognition (`en-IN` / `hi-IN`). A development build is required for the best iPhone voice experience.

## Files
- `mobile/src/lib/captureIntent.ts` — classifier (alarm / reminder / note)
- `mobile/src/components/CaptureCanvas.tsx` — home board
- `mobile/src/lib/captureSave.ts` — save dispatcher
- `GET /api/notes?contains=pdf|link|image` — filter notes by what they contain
- `POST /api/media/upload` — image and PDF upload into note blocks
- `Alarm.oneShotDate` — one-time dated alarms
