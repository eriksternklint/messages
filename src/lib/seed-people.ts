import type { Person } from '@/types';

/**
 * Generate 100 fake people across 8 teams with managers, titles, bios,
 * and profile pictures. Used by the seed flow + the Org Directory so
 * the workspace feels like a real company instead of a dev playground.
 *
 * Deterministic — the same inputs always produce the same people so
 * IDs survive a reload and the auto-chatter loop targets stable users.
 */

interface TeamSpec {
  id: string;
  name: string;
  /** A pool of titles + level pairs the generator picks from. */
  titles: Array<{ title: string; level: string }>;
  /** Department lead — first person on the team becomes this. */
  leadTitle: string;
}

const TEAMS: TeamSpec[] = [
  {
    id: 'team:engineering',
    name: 'Engineering',
    leadTitle: 'VP Engineering',
    titles: [
      { title: 'Software Engineer', level: 'IC3' },
      { title: 'Senior Software Engineer', level: 'IC4' },
      { title: 'Staff Engineer', level: 'IC5' },
      { title: 'Engineering Manager', level: 'M2' },
      { title: 'Platform Engineer', level: 'IC4' },
      { title: 'Site Reliability Engineer', level: 'IC4' },
    ],
  },
  {
    id: 'team:design',
    name: 'Design',
    leadTitle: 'Head of Design',
    titles: [
      { title: 'Product Designer', level: 'IC3' },
      { title: 'Senior Product Designer', level: 'IC4' },
      { title: 'Design Lead', level: 'M2' },
      { title: 'Brand Designer', level: 'IC3' },
      { title: 'Design Systems Engineer', level: 'IC4' },
    ],
  },
  {
    id: 'team:product',
    name: 'Product',
    leadTitle: 'VP Product',
    titles: [
      { title: 'Product Manager', level: 'IC4' },
      { title: 'Senior Product Manager', level: 'IC5' },
      { title: 'Group Product Manager', level: 'M2' },
      { title: 'Technical Product Manager', level: 'IC4' },
    ],
  },
  {
    id: 'team:sales',
    name: 'Sales',
    leadTitle: 'VP Sales',
    titles: [
      { title: 'Account Executive', level: 'IC3' },
      { title: 'Senior Account Executive', level: 'IC4' },
      { title: 'Sales Development Rep', level: 'IC2' },
      { title: 'Solutions Engineer', level: 'IC4' },
      { title: 'Sales Manager', level: 'M2' },
    ],
  },
  {
    id: 'team:marketing',
    name: 'Marketing',
    leadTitle: 'VP Marketing',
    titles: [
      { title: 'Content Marketer', level: 'IC3' },
      { title: 'Growth Marketer', level: 'IC4' },
      { title: 'Brand Manager', level: 'IC4' },
      { title: 'SEO Lead', level: 'IC4' },
      { title: 'Marketing Manager', level: 'M2' },
    ],
  },
  {
    id: 'team:operations',
    name: 'Operations',
    leadTitle: 'COO',
    titles: [
      { title: 'Operations Analyst', level: 'IC3' },
      { title: 'Business Operations Manager', level: 'M2' },
      { title: 'Strategy Lead', level: 'IC5' },
      { title: 'Revenue Operations', level: 'IC4' },
    ],
  },
  {
    id: 'team:people',
    name: 'People',
    leadTitle: 'Head of People',
    titles: [
      { title: 'Recruiter', level: 'IC3' },
      { title: 'People Operations', level: 'IC3' },
      { title: 'HR Business Partner', level: 'IC4' },
      { title: 'Talent Manager', level: 'M2' },
    ],
  },
  {
    id: 'team:finance',
    name: 'Finance & Legal',
    leadTitle: 'CFO',
    titles: [
      { title: 'Financial Analyst', level: 'IC3' },
      { title: 'Senior Accountant', level: 'IC4' },
      { title: 'Legal Counsel', level: 'IC5' },
      { title: 'Controller', level: 'M2' },
    ],
  },
];

const FIRST_NAMES = [
  'Alex', 'Sam', 'Mia', 'Jordan', 'Taylor', 'Riley', 'Morgan', 'Casey',
  'Jamie', 'Avery', 'Quinn', 'Reese', 'Sage', 'Skyler', 'Robin', 'Drew',
  'Hayden', 'Emerson', 'Finley', 'Harper', 'Indigo', 'Jules', 'Kai', 'Lane',
  'Nico', 'Ocean', 'Phoenix', 'River', 'Shay', 'Tatum', 'Uri', 'Vale',
  'Wren', 'Xan', 'Yara', 'Zion', 'Ari', 'Blake', 'Camden', 'Dakota',
  'Elliot', 'Frances', 'Gray', 'Hollis', 'Iris', 'Justice', 'Kendall',
  'Logan', 'Marlowe', 'Noor', 'Oakley', 'Parker', 'Rowan', 'Stevie',
  'Teagan', 'Umi', 'Vesper', 'Wilder', 'Yves', 'Zora',
];

const LAST_NAMES = [
  'Chen', 'Patel', 'Rao', 'Garcia', 'Smith', 'Johnson', 'Williams',
  'Kumar', 'Singh', 'Martinez', 'Anderson', 'Park', 'Wong', 'Kim',
  'Nakamura', 'Schmidt', 'Müller', 'Dubois', 'Rossi', 'Silva', 'Costa',
  'Hassan', 'Ali', 'Khan', 'Cohen', 'Levi', 'Berg', 'Sørensen', 'Hansen',
  'Lindqvist', 'Persson', 'Okafor', 'Adeyemi', 'Mensah', 'Ouellette',
  'Petrov', 'Volkov', 'Yamamoto', 'Tanaka', 'Suzuki', 'Hong', 'Cho',
  'Lee', 'Choi', 'Iyer', 'Reddy', 'Kapoor', 'Mendes', 'Ramos', 'Romero',
];

const LOCATIONS = [
  'San Francisco', 'New York', 'London', 'Berlin', 'Stockholm',
  'Amsterdam', 'Toronto', 'Singapore', 'Tokyo', 'Bangalore', 'Sydney',
  'Remote — PST', 'Remote — EST', 'Remote — CET', 'Lisbon', 'Madrid',
];

const PRONOUNS = ['she/her', 'he/him', 'they/them'];

const INTERESTS_POOL = [
  'climbing', 'pottery', 'rust', 'longboarding', 'mountain biking',
  'baking sourdough', 'film photography', 'open-water swimming',
  'electronic music', 'cooking', 'urban gardening', 'chess', 'D&D',
  'drone racing', 'fly fishing', 'powerlifting', 'pickleball', 'pilates',
  'ceramics', 'pour-over coffee', 'ultramarathons', 'sailing', 'skiing',
  'kite surfing', 'hand-lettering', 'screenprinting', 'birdwatching',
  'foraging', 'home brewing', 'astrophotography',
];

const BIO_TEMPLATES = [
  'Joined to ship things that feel inevitable.',
  'Long-time advocate for small teams and short feedback loops.',
  'I obsess over getting the basics right.',
  'Spent the last decade learning what NOT to ship.',
  'Believer in writing the README first.',
  'Happiest when the inbox is empty and the deploy is green.',
  'Hates meetings, loves async docs.',
  'Repeat founder, recovering perfectionist.',
  'Working at the seam between design and engineering.',
  'Looking for problems no one else wants to touch.',
];

const COLORS: Person['color'][] = [
  'rose', 'amber', 'emerald', 'sky', 'violet', 'indigo', 'teal', 'fuchsia',
];

/** A tiny LCG so the generator is deterministic across reloads. */
function rng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function pick<T>(arr: T[], r: () => number): T {
  return arr[Math.floor(r() * arr.length)];
}

function pickN<T>(arr: T[], n: number, r: () => number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(r() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

/** Stable hashed avatar URL — uses pravatar with a pinned id. */
function avatarFor(id: number): string {
  return `https://i.pravatar.cc/128?img=${(id % 70) + 1}`;
}

/**
 * Build the roster. The result is stable for a given seed — IDs are
 * `u:p<index>` so the auto-chatter loop and channel members can refer
 * to them consistently across reloads.
 */
export function generateOrgPeople(): Person[] {
  const r = rng(42);
  const people: Person[] = [];
  const now = Date.now();
  const day = 86_400_000;

  // Distribute 100 people across the 8 teams, weighted toward eng.
  const weights = [22, 12, 10, 16, 12, 8, 8, 12];
  const counts = weights.slice(); // 100 total

  let id = 1;
  TEAMS.forEach((team, teamIdx) => {
    const count = counts[teamIdx];
    let leadId: string | undefined;

    for (let i = 0; i < count; i++) {
      const personId = `u:p${id}`;
      const first = pick(FIRST_NAMES, r);
      const last = pick(LAST_NAMES, r);
      const name = `${first} ${last}`;
      const titleSpec = i === 0
        ? { title: team.leadTitle, level: 'M3' }
        : pick(team.titles, r);
      const username = `${first}.${last}`.toLowerCase();
      const email = `${username}@node.app`;

      const person: Person = {
        id: personId,
        name,
        email,
        username,
        title: titleSpec.title,
        level: titleSpec.level,
        team: team.name,
        managerId: i === 0 ? undefined : leadId,
        avatarUrl: avatarFor(id),
        color: pick(COLORS, r),
        online: r() > 0.55,
        bio: pick(BIO_TEMPLATES, r),
        pronouns: pick(PRONOUNS, r),
        location: pick(LOCATIONS, r),
        interests: pickN(INTERESTS_POOL, 2 + Math.floor(r() * 3), r),
        startDate: new Date(
          now - (30 + Math.floor(r() * 1500)) * day,
        ).toISOString(),
        addedAt: new Date(
          now - (30 + Math.floor(r() * 1500)) * day,
        ).toISOString(),
      };

      if (i === 0) leadId = personId;
      people.push(person);
      id++;
    }
  });

  return people;
}

/** Surface the team list separately so the directory filter can render it. */
export const ORG_TEAMS = TEAMS.map((t) => t.name);
