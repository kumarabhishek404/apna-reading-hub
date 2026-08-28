import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { interpretCapture, normalizeCaptureText } from './captureIntent';

const NOW = new Date(2026, 7, 27, 21, 0, 0); // Thu 27 Aug 2026, 9:00 PM

describe('normalizeCaptureText', () => {
  it('fixes tommarow and maps Hindi words', () => {
    const text = normalizeCaptureText('mujhe kal 2 ghante book padna hai remind me in the morning');
    assert.match(text, /tomorrow|kal/);
    assert.match(text, /remind/);
    assert.match(text, /book/);
  });
});

describe('interpretCapture', () => {
  it('creates a 6:30 AM alarm for tomorrow from spoken English with typos', () => {
    const intent = interpretCapture({
      text: 'create an alarm for 6:30 in the tommarow morning',
      now: NOW,
    });
    assert.equal(intent.kind, 'alarm');
    assert.equal(intent.time, '06:30');
    assert.equal(intent.oneShotDate, '2026-08-28');
    assert.equal(intent.confidence, 'high');
    assert.match(intent.preview.toLowerCase(), /6:30 am/);
  });

  it('creates a book-reading reminder for tomorrow morning from Hinglish', () => {
    const intent = interpretCapture({
      text: 'mujhe kal 2 ghante book padna hai remind me in the morning',
      now: NOW,
    });
    assert.equal(intent.kind, 'reminder');
    assert.equal(intent.time, '08:00');
    assert.equal(intent.oneShotDate, '2026-08-28');
    assert.equal(intent.durationMinutes, 120);
    assert.match(intent.title.toLowerCase(), /read book/);
    assert.match(intent.title, /2 hour/);
    assert.equal(intent.shouldAutosave, false);
  });

  it('treats 2 ghante baad as a delay, not a reading duration', () => {
    const intent = interpretCapture({
      text: 'remind me 2 ghante baad to drink water',
      now: NOW,
    });
    assert.equal(intent.kind, 'reminder');
    assert.equal(intent.time, '23:00');
    assert.equal(intent.durationMinutes, undefined);
    assert.match(intent.title.toLowerCase(), /drink water/);
  });

  it('saves ordinary writing as a note and does not autosave', () => {
    const intent = interpretCapture({
      text: 'Ideas for the next chapter of my reading journal',
      now: NOW,
    });
    assert.equal(intent.kind, 'note');
    assert.equal(intent.shouldAutosave, false);
    assert.equal(intent.title, 'Ideas for the next chapter');
  });

  it('saves an uploaded PDF as a note and does not autosave', () => {
    const intent = interpretCapture({
      text: '',
      attachments: [{ type: 'pdf', uri: 'file://doc.pdf', name: 'Physics.pdf', mimeType: 'application/pdf' }],
      now: NOW,
    });
    assert.equal(intent.kind, 'note');
    assert.equal(intent.shouldAutosave, false);
    assert.equal(intent.title, 'Physics');
    assert.match(intent.preview, /PDF/);
  });

  it('uses the file name as a short title instead of repeating the writing', () => {
    const intent = interpretCapture({
      text: 'save this pdf',
      attachments: [{ type: 'pdf', uri: 'file://doc.pdf', name: 'Physics.pdf', mimeType: 'application/pdf' }],
      now: NOW,
    });
    assert.equal(intent.title, 'Physics');
    assert.equal(intent.content, 'save this pdf');
  });

  it('saves uploaded images as a note until the user taps save', () => {
    const intent = interpretCapture({
      text: '',
      attachments: [{ type: 'image', uri: 'file://a.jpg', name: 'cover.jpg', mimeType: 'image/jpeg' }],
      now: NOW,
    });
    assert.equal(intent.kind, 'note');
    assert.equal(intent.shouldAutosave, false);
    assert.match(intent.preview, /photo/i);
  });

  it('saves a bare URL as a note that contains a link', () => {
    const intent = interpretCapture({
      text: 'https://example.com/essay',
      now: NOW,
    });
    assert.equal(intent.kind, 'note');
    assert.equal(intent.url, 'https://example.com/essay');
    assert.match(intent.preview, /link/i);
    assert.equal(intent.shouldAutosave, false);
  });

  it('uses 12 o\'clock afternoon as noon, not 2 PM', () => {
    const intent = interpretCapture({
      text: "put a reminder of tomorrow afternoon 12 O'clock for reading about ai voice assistance",
      now: NOW,
    });
    assert.equal(intent.kind, 'reminder');
    assert.equal(intent.time, '12:00');
    assert.equal(intent.oneShotDate, '2026-08-28');
    assert.match(intent.title.toLowerCase(), /reading about ai voice assistance/);
    assert.doesNotMatch(intent.title.toLowerCase(), /12|oclock|o'clock|put/);
    assert.match(intent.preview.toLowerCase(), /12:00 pm/);
  });

  it('keeps 1 o\'clock afternoon as 1:00 PM', () => {
    const intent = interpretCapture({
      text: 'remind me tomorrow afternoon 1 o\'clock to call mom',
      now: NOW,
    });
    assert.equal(intent.kind, 'reminder');
    assert.equal(intent.time, '13:00');
    assert.match(intent.title.toLowerCase(), /call mom/);
  });

  it('uses evening to turn 7 into 7 PM', () => {
    const intent = interpretCapture({
      text: 'remind me tomorrow evening at 7',
      now: NOW,
    });
    assert.equal(intent.kind, 'reminder');
    assert.equal(intent.time, '19:00');
  });


  it('treats Hinglish batana + evening time as a reminder, not a note', () => {
    const intent = interpretCapture({
      text: 'mujhe shaam 4 bje batana ki apnko book padni hai',
      now: NOW,
    });
    assert.equal(intent.kind, 'reminder');
    assert.equal(intent.time, '16:00');
    assert.equal(intent.shouldAutosave, false);
    assert.match(intent.title.toLowerCase(), /read book|book/);
    assert.match(intent.preview.toLowerCase(), /reminder/);
  });

  it('treats Hindi बताना with शाम as a reminder', () => {
    const intent = interpretCapture({
      text: 'मुझे शाम 4 बजे बताना कि आपको किताब पढ़नी है',
      now: NOW,
    });
    assert.equal(intent.kind, 'reminder');
    assert.equal(intent.time, '16:00');
    assert.equal(intent.shouldAutosave, false);
  });

  it('treats English tell me at 4 pm as a reminder', () => {
    const intent = interpretCapture({
      text: 'tell me at 4 pm to read the book',
      now: NOW,
    });
    assert.equal(intent.kind, 'reminder');
    assert.equal(intent.time, '16:00');
    assert.match(intent.title.toLowerCase(), /read/);
  });

  it('treats mujhe + a clock time as a reminder even without the word remind', () => {
    const intent = interpretCapture({
      text: 'mujhe shaam 5 baje gym jana hai',
      now: NOW,
    });
    assert.equal(intent.kind, 'reminder');
    assert.equal(intent.time, '17:00');
  });

  it('treats daily subhah as a morning alarm with a clean title', () => {
    const intent = interpretCapture({
      text: 'Daily subhah',
      now: NOW,
    });
    assert.equal(intent.kind, 'alarm');
    assert.equal(intent.title, 'Morning Alarm');
    assert.deepEqual(intent.repeatDays, [0, 1, 2, 3, 4, 5, 6]);
    assert.equal(intent.shouldAutosave, false);
  });

  it('treats subhah chahiye as a morning alarm, not a note', () => {
    const intent = interpretCapture({
      text: 'Subhah Chahiye',
      now: NOW,
    });
    assert.equal(intent.kind, 'alarm');
    assert.equal(intent.title, 'Morning Alarm');
    assert.equal(intent.shouldAutosave, false);
  });

  it('treats a daily alarm without a date as repeating every day', () => {
    const intent = interpretCapture({
      text: 'set an alarm for 6:30 every day',
      now: NOW,
    });
    assert.equal(intent.kind, 'alarm');
    assert.equal(intent.time, '06:30');
    assert.deepEqual(intent.repeatDays, [0, 1, 2, 3, 4, 5, 6]);
    assert.equal(intent.oneShotDate, undefined);
  });

  it('uses the last Sunday of September, not the next Sunday', () => {
    const intent = interpretCapture({
      text: 'add a reminder of going to noide in the last sunday of month september',
      now: new Date(2026, 7, 28, 21, 0, 0),
    });
    assert.equal(intent.kind, 'reminder');
    assert.equal(intent.oneShotDate, '2026-09-27');
    assert.equal(intent.time, '08:00');
    assert.match(intent.title.toLowerCase(), /going noide/);
    assert.doesNotMatch(intent.title.toLowerCase(), /sunday|september|month|last/);
    assert.match(intent.preview, /2026-09-27/);
  });

  it('uses the first Monday of October in the named month', () => {
    const intent = interpretCapture({
      text: 'remind me on the first monday of october to pay rent',
      now: NOW,
    });
    assert.equal(intent.kind, 'reminder');
    assert.equal(intent.oneShotDate, '2026-10-05');
    assert.match(intent.title.toLowerCase(), /pay rent/);
  });

  it('rolls last Sunday of September to next year when that date has passed', () => {
    const intent = interpretCapture({
      text: 'remind me on the last sunday of september to go to noida',
      now: new Date(2026, 9, 1, 10, 0, 0),
    });
    assert.equal(intent.kind, 'reminder');
    assert.equal(intent.oneShotDate, '2027-09-26');
  });

  it('uses the last Sunday of this year, not the next Sunday', () => {
    const intent = interpretCapture({
      text: 'add a reminder of last sunday of this year morning 4',
      now: new Date(2026, 7, 28, 21, 0, 0),
    });
    assert.equal(intent.kind, 'reminder');
    assert.equal(intent.oneShotDate, '2026-12-27');
    assert.equal(intent.time, '04:00');
    assert.doesNotMatch(intent.title.toLowerCase(), /sunday|year|last/);
    assert.match(intent.preview, /2026-12-27/);
    assert.match(intent.preview.toLowerCase(), /4:00 am/);
  });

  it('uses the last Sunday of next year', () => {
    const intent = interpretCapture({
      text: 'remind me on the last sunday of next year',
      now: new Date(2026, 7, 28, 21, 0, 0),
    });
    assert.equal(intent.oneShotDate, '2027-12-26');
  });
});
