/**
 * Turns free text (English, Hindi, Hinglish) plus attachments into a save action.
 * Rule-based on purpose: works offline, no API key, and covers the phrases people
 * actually say in this app ("create an alarm…", "mujhe kal … remind me…").
 */

import { noteHeadline } from './noteHeadline';

export type CaptureKind = 'note' | 'alarm' | 'reminder';

export type CaptureAttachment = {
  type: 'image' | 'pdf' | 'file' | 'drawing';
  uri: string;
  name?: string;
  mimeType?: string;
};

export type CaptureRepeat = 'none' | 'daily' | 'weekly' | 'monthly';

export type CaptureIntent = {
  kind: CaptureKind;
  confidence: 'high' | 'medium' | 'low';
  title: string;
  content: string;
  description: string;
  time?: string;
  date?: string;
  dueAt?: string;
  oneShotDate?: string;
  repeatDays?: number[];
  repeat?: CaptureRepeat;
  durationMinutes?: number;
  url?: string;
  preview: string;
  shouldAutosave: boolean;
};

export type CaptureInput = {
  text: string;
  attachments?: CaptureAttachment[];
  now?: Date;
};

const TYPOS: Array<[RegExp, string]> = [
  [/\btommarow\b/g, 'tomorrow'],
  [/\btommorow\b/g, 'tomorrow'],
  [/\btommorrow\b/g, 'tomorrow'],
  [/\btomorow\b/g, 'tomorrow'],
  [/\btommorw\b/g, 'tomorrow'],
  [/\btomoroww\b/g, 'tomorrow'],
  [/\balaram\b/g, 'alarm'],
  [/\balaramu\b/g, 'alarm'],
  [/\bremend\b/g, 'remind'],
  [/\bremender\b/g, 'reminder'],
  [/\bghantey\b/g, 'ghante'],
  [/\bghanta\b/g, 'ghante'],
  [/\bgante\b/g, 'ghante'],
  [/\bpadhna\b/g, 'padna'],
  [/\bpadhane\b/g, 'padna'],
  [/\bpadhai\b/g, 'padna'],
  [/\bpadni\b/g, 'padna'],
  [/\bpadhni\b/g, 'padna'],
  [/\bbooking reading\b/g, 'book reading'],
  [/\bbje\b/g, 'baje'],
  [/\bbajee\b/g, 'baje'],
  [/\bbajey\b/g, 'baje'],
  [/\bbajein\b/g, 'baje'],
  [/\bapnko\b/g, 'aapko'],
  [/\bapko\b/g, 'aapko'],
  [/\baapko\b/g, 'aapko'],
  [/\baap ko\b/g, 'aapko'],
  [/\btumko\b/g, 'tumhe'],
  [/\bbataana\b/g, 'batana'],
  [/\bbataao\b/g, 'batao'],
  [/\bbatane\b/g, 'batana'],
  [/\bsubhah\b/g, 'subah'],
  [/\bsubhaah\b/g, 'subah'],
  [/\bchaiye\b/g, 'chahiye'],
  [/\bchahie\b/g, 'chahiye'],
  [/\bchahiyeh\b/g, 'chahiye'],
  [/\bsepetember\b/g, 'september'],
  [/\bseptembar\b/g, 'september'],
  [/\bseptmber\b/g, 'september'],
  [/\bsetember\b/g, 'september'],
];

const DEVANAGARI: Array<[RegExp, string]> = [
  [/मुझे/g, ' mujhe '],
  [/हमको/g, ' mujhe '],
  [/कल/g, ' kal '],
  [/आज/g, ' aaj '],
  [/परसों/g, ' parso '],
  [/सुबह/g, ' subah '],
  [/दोपहर/g, ' dopahar '],
  [/शाम/g, ' shaam '],
  [/रात/g, ' raat '],
  [/घंटे/g, ' ghante '],
  [/घण्टे/g, ' ghante '],
  [/घंटा/g, ' ghante '],
  [/किताब/g, ' book '],
  [/पुस्तक/g, ' book '],
  [/पढ़ना/g, ' padna '],
  [/पढ़नी/g, ' padna '],
  [/पढ़ने/g, ' padna '],
  [/याद दिलाना/g, ' remind '],
  [/याद दिलाओ/g, ' remind '],
  [/याद दिला/g, ' remind '],
  [/याद/g, ' yaad '],
  [/बताना/g, ' batana '],
  [/बताओ/g, ' batao '],
  [/बता दो/g, ' batana '],
  [/बता देना/g, ' batana '],
  [/बता दे/g, ' batana '],
  [/आपको/g, ' aapko '],
  [/तुम्हें/g, ' tumhe '],
  [/तुझे/g, ' tumhe '],
  [/अलार्म/g, ' alarm '],
  [/रिमाइंडर/g, ' reminder '],
  [/मत भूलना/g, ' remind '],
  [/मत भूल/g, ' remind '],
  [/बजे/g, ' baje '],
  [/रोज/g, ' daily '],
  [/हर रोज/g, ' daily '],
  [/चाहिए/g, ' chahiye '],
  [/चाहिये/g, ' chahiye '],
];

const WEEKDAY_NAMES: Record<string, number> = {
  sunday: 0,
  sun: 0,
  ravivar: 0,
  raviwar: 0,
  monday: 1,
  mon: 1,
  somvar: 1,
  somwar: 1,
  tuesday: 2,
  tue: 2,
  mangalvar: 2,
  mangalwar: 2,
  wednesday: 3,
  wed: 3,
  budhvar: 3,
  budhwar: 3,
  thursday: 4,
  thu: 4,
  guruvar: 4,
  guruwar: 4,
  friday: 5,
  fri: 5,
  shukravar: 5,
  shukrawar: 5,
  saturday: 6,
  sat: 6,
  shanivar: 6,
  shaniwar: 6,
};

function pad2(value: number) {
  return String(value).padStart(2, '0');
}

export function toLocalDateString(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function toLocalTimeString(date: Date) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function addDays(base: Date, days: number) {
  const next = new Date(base.getFullYear(), base.getMonth(), base.getDate() + days);
  return next;
}

function atLocalDateTime(date: Date, hour: number, minute: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute, 0, 0);
}

function formatTime12(time: string) {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!match) return time;
  let hour = Number(match[1]);
  const minute = match[2];
  const suffix = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${suffix}`;
}

function formatDayLabel(dateStr: string, now: Date) {
  const today = toLocalDateString(now);
  const tomorrow = toLocalDateString(addDays(now, 1));
  if (dateStr === today) return 'today';
  if (dateStr === tomorrow) return 'tomorrow';
  return dateStr;
}

function collapseSpaces(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

export function normalizeCaptureText(raw: string) {
  let text = raw.toLowerCase();
  for (const [pattern, replacement] of DEVANAGARI) {
    text = text.replace(pattern, replacement);
  }
  text = text.replace(/[’'`]/g, "'");
  // "12 O'clock", "12 o clock", "12oclock" → "12 oclock"
  text = text.replace(/(\d{1,2})\s*o['']?\s*clock\b/g, '$1 oclock');
  text = text.replace(/[.,!?;]+/g, ' ');
  for (const [pattern, replacement] of TYPOS) {
    text = text.replace(pattern, replacement);
  }
  return collapseSpaces(text);
}

function hasAlarmCue(text: string) {
  return (
    /\balarm\b/.test(text) ||
    /\bwake me\b/.test(text) ||
    /\bwake up\b/.test(text) ||
    /\bjag(?:a|aa|ana|ao)\b/.test(text) ||
    /\buth(?:a|aa|ana|ao)\b/.test(text)
  );
}

function hasWantCue(text: string) {
  return /\b(?:chahiye|needed|want)\b/.test(text);
}

function hasReminderCue(text: string) {
  return (
    /\bremind(?:er| me)?\b/.test(text) ||
    /\byaad\b/.test(text) ||
    /\byaad rakh\b/.test(text) ||
    /\bdon't forget\b/.test(text) ||
    /\bdo not forget\b/.test(text) ||
    /\bmat bhool\b/.test(text) ||
    /\bnotify me\b/.test(text) ||
    /\balert me\b/.test(text) ||
    /\btell me\b/.test(text) ||
    /\blet me know\b/.test(text) ||
    /\bping me\b/.test(text) ||
    /\bremember to\b/.test(text) ||
    /\bbatan(?:a|aa|o|ae)?\b/.test(text) ||
    /\bbata (?:do|dena|de|dijie|dijiye|denge)\b/.test(text)
  );
}

function hasHinglishAsk(text: string) {
  return /\b(?:mujhe|mujhko|humko|hamko|please)\b/.test(text);
}

const SCHEDULE_FILLER =
  /\b(?:create|set|make|schedule|put|add|an?|the|please|mujhe|mera|meri|kardo|kar do|laga do|laga|lagao|alarm|reminder|remind(?: me)?|tell me|tell|batana|batao|bata|aapko|tumhe|that|yaad|for|at|on|in|of|to|hai|hain|ho|hoga|ke|ki|ka|ko|tomorrow|today|kal|aaj|parso|morning|subah|subha|evening|shaam|sham|afternoon|night|raat|daily|everyday|every day|roz|har din|oclock|noon|midnight|chahiye|needed|want|just|only|also|last|first|second|third|fourth|fifth|month|months|year|years)\b/g;

function actionPhrase(text: string) {
  const leftover = collapseSpaces(
    ` ${text} `
      .replace(SCHEDULE_FILLER, ' ')
      .replace(/\b\d{1,2}(?:[:.]\d{2})?\s*(?:a\.?m\.?|p\.?m\.?|baje|oclock)?\b/g, ' ')
      .replace(/\b\d{1,2}\s*(?:hours?|hrs?|ghante|ghanta)\b/g, ' '),
  );
  return leftover.length >= 3 ? leftover : '';
}

function looksLikeReminder(text: string) {
  if (hasReminderCue(text)) return true;
  const hasTime = Boolean(parseExplicitTime(text)) || parseDelayMinutes(text) != null;
  if (hasHinglishAsk(text) && hasTime) return true;
  if (parseRepeat(text).repeat && actionPhrase(text)) return true;
  return false;
}

function looksLikeAlarm(text: string) {
  if (hasAlarmCue(text)) return true;
  if (hasReminderCue(text)) return false;
  const period = parsePeriodHour(text);
  const timed = Boolean(parseExplicitTime(text));
  if (hasWantCue(text) && (period || timed)) return true;
  if (parseRepeat(text).repeat && period && !actionPhrase(text)) return true;
  return false;
}

function extractUrl(text: string) {
  const match = text.match(/https?:\/\/[^\s]+/i);
  return match ? match[0].replace(/[),.;]+$/, '') : null;
}

function isMostlyUrl(text: string, url: string) {
  const leftover = collapseSpaces(text.replace(url, ''));
  return leftover.length < 8;
}

type ParsedTime = { hour: number; minute: number; source: 'explicit' | 'period' };

function parsePeriodHour(text: string): ParsedTime | null {
  if (/\b(?:morning|subah|subha|subhah)\b/.test(text)) return { hour: 8, minute: 0, source: 'period' };
  if (/\b(?:afternoon|dopahar|dopehar)\b/.test(text)) return { hour: 14, minute: 0, source: 'period' };
  if (/\b(?:evening|shaam|sham)\b/.test(text)) return { hour: 18, minute: 0, source: 'period' };
  if (/\b(?:night|raat)\b/.test(text)) return { hour: 21, minute: 0, source: 'period' };
  return null;
}

function periodPrefersAm(text: string) {
  return /\b(?:morning|subah|subha|am)\b/.test(text);
}

function periodPrefersPm(text: string) {
  return /\b(?:evening|night|shaam|sham|raat|pm|afternoon|dopahar)\b/.test(text);
}

/**
 * Convert a 1–12 hour to 24h. Period words are only AM/PM hints.
 * "12 o'clock afternoon" is noon (12:00), never the 2:00 PM afternoon default.
 */
function toHour24(hour: number, text: string, meridiem?: string): number | null {
  if (Number.isNaN(hour) || hour < 0 || hour > 23) return null;
  if (hour > 12) return hour;

  const explicitPm = meridiem === 'pm';
  const explicitAm = meridiem === 'am';
  const nightLike = /\b(?:midnight|night|raat)\b/.test(text);
  const morningLike = /\b(?:morning|subah|subha)\b/.test(text);
  const afternoonLike = /\b(?:afternoon|dopahar|noon)\b/.test(text);

  if (hour === 12) {
    if (explicitAm || (morningLike && !afternoonLike && !explicitPm)) return 0;
    if (nightLike && !afternoonLike && !explicitPm) return 0;
    return 12;
  }

  if (explicitPm || (!explicitAm && periodPrefersPm(text) && !periodPrefersAm(text))) {
    return hour + 12;
  }
  return hour;
}

function hourFromMatch(rawHour: string, text: string, meridiem?: string): number | null {
  return toHour24(Number(rawHour), text, meridiem?.replace(/\./g, ''));
}

function parseExplicitTime(text: string): ParsedTime | null {
  if (/\bmidnight\b/.test(text)) {
    return { hour: 0, minute: 0, source: 'explicit' };
  }
  if (/\bnoon\b/.test(text) && !/\b(\d{1,2})\b/.test(text.replace(/\bnoon\b/g, ' '))) {
    return { hour: 12, minute: 0, source: 'explicit' };
  }

  const clock = text.match(/\b(\d{1,2})[:.](\d{2})\s*(a\.?m\.?|p\.?m\.?)?\b/);
  if (clock) {
    const minute = Number(clock[2]);
    if (minute > 59) return null;
    const hour = hourFromMatch(clock[1], text, clock[3]);
    if (hour == null) return null;
    return { hour, minute, source: 'explicit' };
  }

  const oclock = text.match(/\b(\d{1,2})\s*oclock\b/);
  if (oclock) {
    const hour = hourFromMatch(oclock[1], text);
    if (hour == null) return null;
    return { hour, minute: 0, source: 'explicit' };
  }

  const ampm = text.match(/\b(\d{1,2})\s*(a\.?m\.?|p\.?m\.?)\b/);
  if (ampm) {
    const hour = hourFromMatch(ampm[1], text, ampm[2]);
    if (hour == null) return null;
    return { hour, minute: 0, source: 'explicit' };
  }

  const baje = text.match(/\b(\d{1,2})\s*(?::(\d{2}))?\s*baje\b/);
  if (baje) {
    const minute = baje[2] ? Number(baje[2]) : 0;
    if (minute > 59) return null;
    const hour = hourFromMatch(baje[1], text);
    if (hour == null) return null;
    return { hour, minute, source: 'explicit' };
  }

  const atHour = text.match(/\b(?:at|@)\s*(\d{1,2})\b/);
  if (atHour && !/\b(?:hours?|hrs?|ghante|ghanta|minutes?|mins?)\b/.test(text.slice(atHour.index ?? 0, (atHour.index ?? 0) + 20))) {
    const hour = hourFromMatch(atHour[1], text);
    if (hour == null) return null;
    return { hour, minute: 0, source: 'explicit' };
  }

  // "afternoon 12" / "12 in the afternoon" without o'clock
  const besidePeriod = text.match(
    /\b(?:morning|afternoon|evening|night|subah|subha|shaam|dopahar|raat)\s+(\d{1,2})\b/,
  ) || text.match(
    /\b(\d{1,2})\s+(?:in\s+the\s+)?(?:morning|afternoon|evening|night|subah|shaam|dopahar|raat)\b/,
  );
  if (besidePeriod) {
    const raw = besidePeriod[1];
    if (!/\b(?:hours?|hrs?|ghante|ghanta)\b/.test(text)) {
      const hour = hourFromMatch(raw, text);
      if (hour == null) return null;
      return { hour, minute: 0, source: 'explicit' };
    }
  }

  return null;
}

function parseDelayMinutes(text: string): number | null {
  const delay = text.match(
    /\b(?:in|after|baad)\s+(\d{1,2})\s*(?:hours?|hrs?|ghante|ghanta)\b/,
  );
  if (delay) return Number(delay[1]) * 60;

  const hindiDelay = text.match(/\b(\d{1,2})\s*(?:hours?|hrs?|ghante|ghanta)\s+(?:baad|later|mein)\b/);
  if (hindiDelay) return Number(hindiDelay[1]) * 60;

  const minutes = text.match(/\b(?:in|after)\s+(\d{1,3})\s*(?:minutes?|mins?)\b/);
  if (minutes) return Number(minutes[1]);

  return null;
}

function parseDurationMinutes(text: string): number | null {
  if (parseDelayMinutes(text) != null) return null;
  const match = text.match(
    /\b(?:for\s+)?(\d{1,2})\s*(?:hours?|hrs?|ghante|ghanta)\b/,
  );
  if (!match) return null;
  return Number(match[1]) * 60;
}

const WEEKDAY_PATTERN =
  'sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tue|wed|thu|fri|sat|ravivar|raviwar|somvar|somwar|mangalvar|mangalwar|budhvar|budhwar|guruvar|guruwar|shukravar|shukrawar|shanivar|shaniwar';

const MONTH_NAMES: Record<string, number> = {
  january: 0,
  jan: 0,
  february: 1,
  feb: 1,
  march: 2,
  mar: 2,
  april: 3,
  apr: 3,
  may: 4,
  june: 5,
  jun: 5,
  july: 6,
  jul: 6,
  august: 7,
  aug: 7,
  september: 8,
  sept: 8,
  sep: 8,
  october: 9,
  oct: 9,
  november: 10,
  nov: 10,
  december: 11,
  dec: 11,
};

const MONTH_PATTERN =
  'january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sept|sep|october|oct|november|nov|december|dec';

const ORDINAL_PATTERN = 'last|first|second|third|fourth|fifth|1st|2nd|3rd|4th|5th';

type DateShift = {
  date: Date;
  oneShot: boolean;
  matched?: string;
  pinned?: boolean;
};

function parseOrdinalToken(raw: string): number | 'last' | null {
  if (raw === 'last') return 'last';
  if (raw === 'first' || raw === '1st') return 1;
  if (raw === 'second' || raw === '2nd') return 2;
  if (raw === 'third' || raw === '3rd') return 3;
  if (raw === 'fourth' || raw === '4th') return 4;
  if (raw === 'fifth' || raw === '5th') return 5;
  return null;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function nthWeekdayOfMonth(
  year: number,
  monthIndex: number,
  weekday: number,
  nth: number | 'last',
): Date | null {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  if (nth === 'last') {
    for (let day = lastDay; day >= 1; day -= 1) {
      const candidate = new Date(year, monthIndex, day);
      if (candidate.getDay() === weekday) return candidate;
    }
    return null;
  }

  let count = 0;
  for (let day = 1; day <= lastDay; day += 1) {
    const candidate = new Date(year, monthIndex, day);
    if (candidate.getDay() === weekday) {
      count += 1;
      if (count === nth) return candidate;
    }
  }

  if (nth === 5) return nthWeekdayOfMonth(year, monthIndex, weekday, 'last');
  return null;
}

function futureNthWeekday(
  now: Date,
  monthIndex: number,
  weekday: number,
  nth: number | 'last',
  explicitYear?: number,
): Date | null {
  const year = explicitYear ?? now.getFullYear();
  let date = nthWeekdayOfMonth(year, monthIndex, weekday, nth);
  if (!date) return null;
  if (explicitYear == null && date < startOfDay(now)) {
    date = nthWeekdayOfMonth(year + 1, monthIndex, weekday, nth);
  }
  return date;
}

function futureMonthDay(
  now: Date,
  monthIndex: number,
  day: number,
  explicitYear?: number,
): Date | null {
  const year = explicitYear ?? now.getFullYear();
  const date = new Date(year, monthIndex, day);
  if (date.getMonth() !== monthIndex || date.getDate() !== day) return null;
  if (explicitYear == null && date < startOfDay(now)) {
    const next = new Date(year + 1, monthIndex, day);
    if (next.getMonth() !== monthIndex) return null;
    return next;
  }
  return date;
}

function nthWeekdayFromAnchor(
  now: Date,
  anchor: Date,
  weekday: number,
  nth: number | 'last',
): Date | null {
  let date = nthWeekdayOfMonth(anchor.getFullYear(), anchor.getMonth(), weekday, nth);
  if (date && date < startOfDay(now)) {
    const next = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1);
    date = nthWeekdayOfMonth(next.getFullYear(), next.getMonth(), weekday, nth);
  }
  return date;
}

function nthWeekdayOfYear(
  year: number,
  weekday: number,
  nth: number | 'last',
): Date | null {
  if (nth === 'last') {
    return nthWeekdayOfMonth(year, 11, weekday, 'last');
  }

  let count = 0;
  for (let month = 0; month < 12; month += 1) {
    const lastDay = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= lastDay; day += 1) {
      const candidate = new Date(year, month, day);
      if (candidate.getDay() === weekday) {
        count += 1;
        if (count === nth) return candidate;
      }
    }
  }
  return null;
}

function futureNthWeekdayOfYear(
  now: Date,
  weekday: number,
  nth: number | 'last',
  options: { year?: number; offset?: 'this' | 'next' } = {},
): Date | null {
  let year = options.year ?? now.getFullYear();
  if (options.offset === 'next') year = now.getFullYear() + 1;
  let date = nthWeekdayOfYear(year, weekday, nth);
  if (!date) return null;
  const shouldRoll = options.year == null && options.offset !== 'next';
  if (shouldRoll && date < startOfDay(now)) {
    date = nthWeekdayOfYear(year + 1, weekday, nth);
  }
  return date;
}

function nextWeekday(now: Date, weekday: number) {
  const current = now.getDay();
  let delta = weekday - current;
  if (delta <= 0) delta += 7;
  return addDays(now, delta);
}

function parseDateShift(text: string, now: Date): DateShift | null {
  if (/\b(?:day after tomorrow|parso|parson)\b/.test(text)) {
    return { date: addDays(now, 2), oneShot: true };
  }
  if (/\b(?:tomorrow|kal)\b/.test(text)) {
    return { date: addDays(now, 1), oneShot: true };
  }
  if (/\b(?:today|aaj)\b/.test(text)) {
    return { date: addDays(now, 0), oneShot: true };
  }

  const nthOfNamedMonth = text.match(
    new RegExp(
      `\\b(${ORDINAL_PATTERN})\\s+(${WEEKDAY_PATTERN})\\s+(?:of|in)\\s+(?:the\\s+)?(?:month\\s+(?:of\\s+)?)?(${MONTH_PATTERN})(?:\\s+(\\d{4}))?\\b`,
    ),
  );
  if (nthOfNamedMonth) {
    const nth = parseOrdinalToken(nthOfNamedMonth[1]);
    const weekday = WEEKDAY_NAMES[nthOfNamedMonth[2]];
    const monthIndex = MONTH_NAMES[nthOfNamedMonth[3]];
    const year = nthOfNamedMonth[4] ? Number(nthOfNamedMonth[4]) : undefined;
    if (nth != null && weekday != null && monthIndex != null) {
      const date = futureNthWeekday(now, monthIndex, weekday, nth, year);
      if (date) return { date, oneShot: true, matched: nthOfNamedMonth[0], pinned: true };
    }
  }

  const namedMonthNth = text.match(
    new RegExp(
      `\\b(${MONTH_PATTERN})(?:'s)?\\s+(?:month\\s+)?(${ORDINAL_PATTERN})\\s+(${WEEKDAY_PATTERN})(?:\\s+(\\d{4}))?\\b`,
    ),
  );
  if (namedMonthNth) {
    const monthIndex = MONTH_NAMES[namedMonthNth[1]];
    const nth = parseOrdinalToken(namedMonthNth[2]);
    const weekday = WEEKDAY_NAMES[namedMonthNth[3]];
    const year = namedMonthNth[4] ? Number(namedMonthNth[4]) : undefined;
    if (nth != null && weekday != null && monthIndex != null) {
      const date = futureNthWeekday(now, monthIndex, weekday, nth, year);
      if (date) return { date, oneShot: true, matched: namedMonthNth[0], pinned: true };
    }
  }

  const nthBareMonth = text.match(
    new RegExp(
      `\\b(${ORDINAL_PATTERN})\\s+(${WEEKDAY_PATTERN})\\s+(${MONTH_PATTERN})(?:\\s+(\\d{4}))?\\b`,
    ),
  );
  if (nthBareMonth) {
    const nth = parseOrdinalToken(nthBareMonth[1]);
    const weekday = WEEKDAY_NAMES[nthBareMonth[2]];
    const monthIndex = MONTH_NAMES[nthBareMonth[3]];
    const year = nthBareMonth[4] ? Number(nthBareMonth[4]) : undefined;
    if (nth != null && weekday != null && monthIndex != null) {
      const date = futureNthWeekday(now, monthIndex, weekday, nth, year);
      if (date) return { date, oneShot: true, matched: nthBareMonth[0], pinned: true };
    }
  }

  const nthThisNext = text.match(
    new RegExp(
      `\\b(${ORDINAL_PATTERN})\\s+(${WEEKDAY_PATTERN})\\s+(?:of|in)\\s+(?:the\\s+)?(this|next)\\s+month\\b`,
    ),
  );
  if (nthThisNext) {
    const nth = parseOrdinalToken(nthThisNext[1]);
    const weekday = WEEKDAY_NAMES[nthThisNext[2]];
    const offset = nthThisNext[3] === 'next' ? 1 : 0;
    const anchor = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    if (nth != null && weekday != null) {
      const date = nthWeekdayFromAnchor(now, anchor, weekday, nth);
      if (date) return { date, oneShot: true, matched: nthThisNext[0], pinned: true };
    }
  }

  const nthOfTheMonth = text.match(
    new RegExp(
      `\\b(${ORDINAL_PATTERN})\\s+(${WEEKDAY_PATTERN})\\s+(?:of|in)\\s+(?:the\\s+)?month\\b`,
    ),
  );
  if (nthOfTheMonth) {
    const nth = parseOrdinalToken(nthOfTheMonth[1]);
    const weekday = WEEKDAY_NAMES[nthOfTheMonth[2]];
    if (nth != null && weekday != null) {
      const date = nthWeekdayFromAnchor(now, now, weekday, nth);
      if (date) return { date, oneShot: true, matched: nthOfTheMonth[0], pinned: true };
    }
  }

  const nthOfYear = text.match(
    new RegExp(
      `\\b(${ORDINAL_PATTERN})\\s+(${WEEKDAY_PATTERN})\\s+(?:of|in)\\s+(?:the\\s+)?(?:(this|next)\\s+)?year\\b`,
    ),
  );
  if (nthOfYear) {
    const nth = parseOrdinalToken(nthOfYear[1]);
    const weekday = WEEKDAY_NAMES[nthOfYear[2]];
    const offset = nthOfYear[3] === 'next' ? 'next' : 'this';
    if (nth != null && weekday != null) {
      const date = futureNthWeekdayOfYear(now, weekday, nth, { offset });
      if (date) return { date, oneShot: true, matched: nthOfYear[0], pinned: true };
    }
  }

  const yearThenNth = text.match(
    new RegExp(
      `\\b(this|next)\\s+year(?:'s)?\\s+(${ORDINAL_PATTERN})\\s+(${WEEKDAY_PATTERN})\\b`,
    ),
  );
  if (yearThenNth) {
    const offset = yearThenNth[1] === 'next' ? 'next' : 'this';
    const nth = parseOrdinalToken(yearThenNth[2]);
    const weekday = WEEKDAY_NAMES[yearThenNth[3]];
    if (nth != null && weekday != null) {
      const date = futureNthWeekdayOfYear(now, weekday, nth, { offset });
      if (date) return { date, oneShot: true, matched: yearThenNth[0], pinned: true };
    }
  }

  const nthOfYearNumber = text.match(
    new RegExp(
      `\\b(${ORDINAL_PATTERN})\\s+(${WEEKDAY_PATTERN})\\s+(?:of|in)\\s+(?:the\\s+)?(?:year\\s+)?(\\d{4})\\b`,
    ),
  );
  if (nthOfYearNumber) {
    const nth = parseOrdinalToken(nthOfYearNumber[1]);
    const weekday = WEEKDAY_NAMES[nthOfYearNumber[2]];
    const year = Number(nthOfYearNumber[3]);
    if (nth != null && weekday != null && year >= 2000 && year <= 2100) {
      const date = futureNthWeekdayOfYear(now, weekday, nth, { year });
      if (date) return { date, oneShot: true, matched: nthOfYearNumber[0], pinned: true };
    }
  }

  const dayOfMonth = text.match(
    new RegExp(
      `\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?(${MONTH_PATTERN})(?:\\s+(\\d{4}))?\\b`,
    ),
  );
  if (dayOfMonth) {
    const day = Number(dayOfMonth[1]);
    const monthIndex = MONTH_NAMES[dayOfMonth[2]];
    const year = dayOfMonth[3] ? Number(dayOfMonth[3]) : undefined;
    if (monthIndex != null && day >= 1 && day <= 31) {
      const date = futureMonthDay(now, monthIndex, day, year);
      if (date) return { date, oneShot: true, matched: dayOfMonth[0], pinned: true };
    }
  }

  const monthDay = text.match(
    new RegExp(
      `\\b(${MONTH_PATTERN})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:\\s+(\\d{4}))?\\b`,
    ),
  );
  if (monthDay) {
    const monthIndex = MONTH_NAMES[monthDay[1]];
    const day = Number(monthDay[2]);
    const year = monthDay[3] ? Number(monthDay[3]) : undefined;
    if (monthIndex != null && day >= 1 && day <= 31) {
      const date = futureMonthDay(now, monthIndex, day, year);
      if (date) return { date, oneShot: true, matched: monthDay[0], pinned: true };
    }
  }

  const nextDay = text.match(
    new RegExp(
      `\\b(?:on\\s+|this\\s+|next\\s+)?(${WEEKDAY_PATTERN})\\b`,
    ),
  );
  if (nextDay) {
    const weekday = WEEKDAY_NAMES[nextDay[1]];
    if (weekday != null) {
      return { date: nextWeekday(now, weekday), oneShot: true, matched: nextDay[0] };
    }
  }

  return null;
}

function parseRepeat(text: string): { repeat?: CaptureRepeat; repeatDays?: number[] } {
  if (/\b(?:every day|everyday|daily|roz|har din)\b/.test(text)) {
    return { repeat: 'daily', repeatDays: [0, 1, 2, 3, 4, 5, 6] };
  }
  if (/\b(?:weekdays|weekday|monday to friday)\b/.test(text)) {
    return { repeat: 'weekly', repeatDays: [1, 2, 3, 4, 5] };
  }
  if (/\b(?:weekends|weekend)\b/.test(text)) {
    return { repeat: 'weekly', repeatDays: [0, 6] };
  }
  if (/\bevery week\b/.test(text)) {
    return { repeat: 'weekly' };
  }
  if (/\bevery month\b/.test(text)) {
    return { repeat: 'monthly' };
  }
  return {};
}

function periodName(text: string): 'morning' | 'afternoon' | 'evening' | 'night' | null {
  if (/\b(?:morning|subah|subha|subhah)\b/.test(text)) return 'morning';
  if (/\b(?:afternoon|dopahar|dopehar)\b/.test(text)) return 'afternoon';
  if (/\b(?:evening|shaam|sham)\b/.test(text)) return 'evening';
  if (/\b(?:night|raat)\b/.test(text)) return 'night';
  return null;
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

function extractTitle(text: string, kind: CaptureKind, durationMinutes?: number, clockHour?: number) {
  let leftover = actionPhrase(text);

  if (clockHour != null) {
    const hour12 = clockHour % 12 || 12;
    leftover = leftover
      .replace(new RegExp(`\\b${clockHour}\\b`, 'g'), ' ')
      .replace(new RegExp(`\\b${hour12}\\b`, 'g'), ' ');
    leftover = collapseSpaces(leftover);
  }

  leftover = leftover.replace(/\b(?:jana|jaana|jao|jaane)\b/g, ' ').trim();
  leftover = leftover.replace(new RegExp(`\\b(?:${WEEKDAY_PATTERN}|${MONTH_PATTERN})\\b`, 'g'), ' ');
  leftover = collapseSpaces(leftover);

  if (/\b(?:book|kitab).*\bpadna\b/.test(` ${leftover} `) || /\bpadna\b.*\b(?:book|kitab)\b/.test(` ${leftover} `)) {
    leftover = 'read book';
  } else if (/\bpadna\b/.test(leftover) && /\bbook\b/.test(leftover)) {
    leftover = 'read book';
  } else if (/\bbook reading\b/.test(leftover) || /\bread(?:ing)? book\b/.test(leftover)) {
    leftover = 'read book';
  } else {
    leftover = leftover.replace(/\bpadna\b/g, 'read').trim();
  }

  const period = periodName(text);
  const daily = Boolean(parseRepeat(text).repeat);

  if (!leftover) {
    if (kind === 'alarm') {
      if (daily && period) return titleCase(`${period} alarm`);
      if (daily) return 'Daily alarm';
      if (period) return titleCase(`${period} alarm`);
      return 'Alarm';
    }
    if (kind === 'reminder') {
      if (daily && period) return titleCase(`Daily ${period} reminder`);
      if (daily) return 'Daily reminder';
      if (period) return titleCase(`${period} reminder`);
      return 'Reminder';
    }
    return 'Note';
  }

  leftover = titleCase(leftover);

  if (durationMinutes && durationMinutes >= 60) {
    const hours = Math.round(durationMinutes / 60);
    leftover = `${leftover} (${hours} hour${hours === 1 ? '' : 's'})`;
  }

  return leftover;
}

function titleFromNote(text: string, attachments: CaptureAttachment[] = [], url?: string | null) {
  const pdfs = pdfAttachments(attachments);
  const images = imageAttachments(attachments);
  const drawings = drawingAttachments(attachments);
  return noteHeadline({
    title: '',
    content: text,
    blocks: [
      ...(text ? [{ type: 'text', content: text }] : []),
      ...pdfs.map((pdf) => ({ type: 'pdf', content: pdf.name || 'document.pdf' })),
      ...drawings.map(() => ({ type: 'handwriting' as const })),
      ...images.map(() => ({ type: 'image' as const })),
      ...(url ? [{ type: 'url', url, content: url }] : []),
    ],
  });
}

function buildDueAt(now: Date, date: Date, time: ParsedTime) {
  let due = atLocalDateTime(date, time.hour, time.minute);
  if (due.getTime() <= now.getTime() && toLocalDateString(date) === toLocalDateString(now)) {
    due = addDays(due, 1);
    due = atLocalDateTime(due, time.hour, time.minute);
  }
  return due;
}

export function pdfAttachments(attachments: CaptureAttachment[]) {
  return attachments.filter(
    (item) =>
      item.type === 'pdf' ||
      (item.mimeType || '').includes('pdf') ||
      (item.name || '').toLowerCase().endsWith('.pdf'),
  );
}

export function drawingAttachments(attachments: CaptureAttachment[]) {
  return attachments.filter((item) => item.type === 'drawing');
}

export function imageAttachments(attachments: CaptureAttachment[]) {
  return attachments.filter(
    (item) =>
      item.type === 'image' ||
      ((item.mimeType || '').startsWith('image/') && item.type !== 'drawing') ||
      (item.type !== 'drawing' && /\.(jpe?g|gif|webp|heic)$/i.test(item.name || '')),
  );
}

function notePreview(options: {
  pdfCount: number;
  imageCount: number;
  drawingCount: number;
  url?: string | null;
}) {
  const bits = ['Note'];
  if (options.pdfCount > 0) bits.push(options.pdfCount === 1 ? 'PDF' : `${options.pdfCount} PDFs`);
  if (options.drawingCount > 0) bits.push(options.drawingCount === 1 ? 'drawing' : `${options.drawingCount} drawings`);
  if (options.imageCount > 0) bits.push(options.imageCount === 1 ? 'photo' : `${options.imageCount} photos`);
  if (options.url) bits.push('link');
  return bits.join(' · ');
}

export function interpretCapture(input: CaptureInput): CaptureIntent {
  const now = input.now ?? new Date();
  const original = input.text || '';
  const text = normalizeCaptureText(original);
  const attachments = input.attachments ?? [];
  const pdfs = pdfAttachments(attachments);
  const images = imageAttachments(attachments);
  const drawings = drawingAttachments(attachments);
  const url = extractUrl(original.trim() || text);

  const alarmCue = looksLikeAlarm(text);
  const reminderCue = looksLikeReminder(text);
  const isCommand = alarmCue || reminderCue;

  if (!isCommand && (pdfs.length > 0 || images.length > 0 || drawings.length > 0 || (url && isMostlyUrl(original.trim(), url)))) {
    const title = titleFromNote(original.trim(), attachments, url);
    return {
      kind: 'note',
      confidence: 'high',
      title,
      content: original.trim(),
      description: original.trim(),
      url: url || undefined,
      preview: notePreview({
        pdfCount: pdfs.length,
        imageCount: images.length,
        drawingCount: drawings.length,
        url,
      }),
      shouldAutosave: false,
    };
  }

  if (isCommand) {
    const kind: CaptureKind = hasReminderCue(text) || (reminderCue && !alarmCue) ? 'reminder' : 'alarm';
    const delayMinutes = parseDelayMinutes(text);
    const durationMinutes = parseDurationMinutes(text) ?? undefined;
    const repeatInfo = parseRepeat(text);
    const dateShift = parseDateShift(text, now);
    const explicitTime = parseExplicitTime(text);
    const periodTime = parsePeriodHour(text);

    let due = new Date(now);
    let time: ParsedTime | undefined;
    let oneShotDate: string | undefined;
    let dateLabel: string | undefined;

    if (delayMinutes != null) {
      due = new Date(now.getTime() + delayMinutes * 60 * 1000);
      time = { hour: due.getHours(), minute: due.getMinutes(), source: 'explicit' };
      dateLabel = toLocalDateString(due);
      if (kind === 'reminder' || dateShift?.oneShot) oneShotDate = dateLabel;
    } else {
      time = explicitTime ?? periodTime ?? (kind === 'alarm'
        ? { hour: 7, minute: 0, source: 'period' }
        : { hour: 8, minute: 0, source: 'period' });
      const baseDate = dateShift?.date ?? addDays(now, 0);
      due = dateShift?.pinned
        ? atLocalDateTime(baseDate, time.hour, time.minute)
        : buildDueAt(now, baseDate, time);
      dateLabel = toLocalDateString(due);
      if (dateShift?.oneShot || kind === 'reminder') {
        oneShotDate = dateLabel;
      }
    }

    const hhmm = `${pad2(time.hour)}:${pad2(time.minute)}`;
    const titleSource = dateShift?.matched
      ? collapseSpaces(text.replace(dateShift.matched, ' '))
      : text;
    const title = extractTitle(titleSource, kind, durationMinutes, time.hour);
    const when = `${formatDayLabel(dateLabel, now)} ${formatTime12(hhmm)}`;
    const preview =
      kind === 'alarm'
        ? `Alarm · ${formatTime12(hhmm)}${oneShotDate ? ` · ${formatDayLabel(oneShotDate, now)}` : repeatInfo.repeat === 'daily' ? ' · daily' : ''}`
        : `Reminder · ${title} · ${when}`;

    return {
      kind,
      confidence: 'high',
      title,
      content: original.trim(),
      description: original.trim(),
      time: hhmm,
      date: dateLabel,
      dueAt: due.toISOString(),
      oneShotDate,
      repeatDays:
        kind === 'alarm'
          ? repeatInfo.repeatDays ?? (oneShotDate ? [due.getDay()] : [0, 1, 2, 3, 4, 5, 6])
          : undefined,
      repeat: kind === 'reminder' ? repeatInfo.repeat ?? 'none' : undefined,
      durationMinutes,
      preview,
      shouldAutosave: false,
    };
  }

  const noteTitle = titleFromNote(original.trim(), attachments, url);
  return {
    kind: 'note',
    confidence: 'low',
    title: noteTitle,
    content: original.trim(),
    description: original.trim(),
    url: url || undefined,
    preview: notePreview({
      pdfCount: pdfs.length,
      imageCount: images.length,
      drawingCount: drawings.length,
      url,
    }),
    shouldAutosave: false,
  };
}

export function isBlankCapture(input: CaptureInput) {
  const hasText = Boolean(input.text?.trim());
  const hasFiles = Boolean(input.attachments?.length);
  return !hasText && !hasFiles;
}
