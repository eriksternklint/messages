import type { Message, PriorityBucket } from '@/types';

/**
 * Lightweight NLP intent classifier for the Ghost Tracking layer.
 *
 * A real implementation would route through an LLM or a trained
 * intent model. For the MVP we use hand-tuned regexes that cover
 * the handful of patterns the Priority Feed needs:
 *
 *   • commitments ("I'll get back to you Friday") → `waiting` +
 *     `deferUntil` extracted from a day-of-week reference
 *   • questions / deadlines                         → `action`
 *   • very short pleasantries                        → `noise`
 *   • everything else                                → `fyi`
 */
export interface IntentResult {
  priority: PriorityBucket;
  intentTags: string[];
  deferUntil?: string;
}

const RE_COMMITMENT = /\b(i['’]ll|i will|get back|ping you|reply|circle back|touch base|follow up)\b/i;
const RE_QUESTION = /\?/;
const RE_URGENT = /\b(asap|urgent|eod|end of day|right now|immediately|by tonight|by today)\b/i;
const RE_DEADLINE = /\b(today|tonight|tomorrow|friday|thursday|monday|tuesday|wednesday|saturday|sunday|eod)\b/i;
const RE_DAY =
  /\b(today|tomorrow|(?:next\s)?(?:mon|tue|tues|wed|wednes|thu|thur|thurs|fri|sat|satur|sun)(?:day)?)\b/i;

export function classifyIntent(message: Message): IntentResult {
  const text = message.rawText.trim();
  const tags: string[] = [];

  if (RE_COMMITMENT.test(text)) {
    tags.push('commitment');
    const day = text.match(RE_DAY)?.[0];
    return {
      priority: 'waiting',
      intentTags: tags,
      deferUntil: day ? nextOccurrence(day).toISOString() : undefined,
    };
  }

  if (RE_QUESTION.test(text)) {
    tags.push('question');
    if (RE_URGENT.test(text) || RE_DEADLINE.test(text)) tags.push('deadline');
    return { priority: 'action', intentTags: tags };
  }

  if (RE_URGENT.test(text)) {
    tags.push('deadline');
    return { priority: 'action', intentTags: tags };
  }

  if (text.length <= 8) {
    return { priority: 'noise', intentTags: tags };
  }

  return { priority: 'fyi', intentTags: tags };
}

/**
 * Resolve a day-of-week or relative-day phrase to the next concrete
 * Date. Returns today for "today", tomorrow for "tomorrow", and the
 * upcoming weekday (strictly in the future; same weekday means +7).
 */
export function nextOccurrence(dayPhrase: string, from: Date = new Date()): Date {
  const lower = dayPhrase.toLowerCase();
  const now = new Date(from);

  if (lower === 'today' || lower === 'tonight') return now;
  if (lower === 'tomorrow') {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return d;
  }

  const weekdays = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  const target = weekdays.findIndex((d) => lower.startsWith(d.slice(0, 3)));
  if (target < 0) return now;

  const d = new Date(now);
  const diff = (target - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d;
}
