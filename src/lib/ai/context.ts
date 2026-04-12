/**
 * Mock RAG / vector search layer.
 *
 * Stands in for a real Pinecone-style embedding lookup. A tiny
 * in-memory knowledge base of fake Notion/HubSpot/Drive/Calendar
 * documents; a deterministic keyword-overlap scorer approximates
 * semantic retrieval closely enough for the MVP to feel real.
 *
 * Step 3 MVP intentionally avoids a real embedding index. When we
 * wire the live Notion MCP tools in a later step, `vectorSearch` will
 * be replaced with a function that hits the real index; every caller
 * of this module depends only on the `KnowledgeDoc` shape and `topK`
 * contract, so the swap is local.
 */

export interface KnowledgeDoc {
  id: string;
  source: 'notion' | 'hubspot' | 'drive' | 'calendar';
  title: string;
  content: string;
  tags: string[];
}

const KB: KnowledgeDoc[] = [
  {
    id: 'notion:q2-okrs',
    source: 'notion',
    title: 'Q2 OKRs (draft v2)',
    content:
      'Platform migration, onboarding redesign, hiring plan, infra cost reduction. Owner: Alex. Status: draft. Key risks: Jan to Feb slip on migration.',
    tags: ['okrs', 'q2', 'roadmap', 'platform', 'migration', 'review'],
  },
  {
    id: 'notion:platform-migration-doc',
    source: 'notion',
    title: 'Platform Migration Plan',
    content:
      'Three-phase migration to new platform. Phase 1 done, Phase 2 in progress. Jan to Feb timing slip under review by eng leadership.',
    tags: ['platform', 'migration', 'infra', 'engineering'],
  },
  {
    id: 'notion:onboarding-spec',
    source: 'notion',
    title: 'Onboarding Flow Spec',
    content:
      'Current 5-step onboarding, proposed 3-step redesign. Mia leading design critique. Review scheduled Thursday.',
    tags: ['onboarding', 'design', 'product', 'review', 'thursday'],
  },
  {
    id: 'hubspot:acme-deal',
    source: 'hubspot',
    title: 'Acme Corp — Enterprise Deal',
    content:
      'Stage: Security Review. Value: $120k ARR. SOC2 packet requested by procurement. Waiting on our side.',
    tags: [
      'acme',
      'crm',
      'soc2',
      'security',
      'deal',
      'procurement',
      'enterprise',
    ],
  },
  {
    id: 'drive:soc2-packet',
    source: 'drive',
    title: 'SOC2 Security Packet',
    content:
      'Signed compliance documents, vendor questionnaire, recent audit report. Ready to send on request.',
    tags: ['soc2', 'security', 'compliance', 'packet'],
  },
  {
    id: 'calendar:sunday-free',
    source: 'calendar',
    title: 'Sunday schedule',
    content:
      'No events scheduled Sunday evening. Default availability for personal commitments.',
    tags: ['calendar', 'sunday', 'dinner', 'family', 'personal'],
  },
  {
    id: 'notion:vendor-contract',
    source: 'notion',
    title: 'New Vendor Contract',
    content:
      'Draft reviewed by finance. Legal review outstanding; blocker for vendor onboarding.',
    tags: ['legal', 'vendor', 'contract', 'blocker', 'waiting'],
  },
];

/**
 * Deterministic keyword-overlap scorer. Words in the query are
 * lowercased and matched against each doc's title + content + tags.
 * Score = number of unique query terms found in the doc.
 */
export function vectorSearch(query: string, topK = 3): KnowledgeDoc[] {
  const terms = Array.from(
    new Set((query.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((t) => t.length > 2)),
  );
  if (terms.length === 0) return [];

  const scored = KB.map((doc) => {
    const hay = `${doc.title} ${doc.content} ${doc.tags.join(' ')}`.toLowerCase();
    const score = terms.reduce((n, t) => (hay.includes(t) ? n + 1 : n), 0);
    return { doc, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((s) => s.doc);
}
