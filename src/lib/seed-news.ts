import type { NewsStory } from '@/types/news';

export const SEED_STORIES: NewsStory[] = [
  {
    id: 'story-001',
    headline: 'G20 Nations Reach Landmark Climate Finance Agreement',
    summary:
      'World leaders at the G20 summit in New Delhi have struck a deal to triple climate finance to developing nations, pledging $300 billion annually by 2035. The agreement, brokered after 72 hours of talks, establishes a new framework for how wealthier nations compensate countries most affected by climate change despite contributing least to it.\n\nThe deal includes binding commitments from the United States, European Union, and China — the world\'s three largest emitters — to phase down unabated coal power and double renewable energy capacity by the end of the decade. A separate provision creates a "loss and damage" fund, long demanded by Pacific island nations, which will receive initial contributions of $20 billion.\n\nEconomists estimate the transition will require $4–6 trillion in investment annually by 2030, meaning the pledged public finance must unlock significantly larger private-sector flows. Implementation will be tracked through a new UN review mechanism with annual reporting requirements.',
    whatItMeans:
      'In plain terms: rich countries agreed to pay more to help poorer countries deal with climate change and build clean energy systems. Think of it as a combination of an insurance payout for past pollution damage and an investment in cleaner infrastructure for the future. For the average person, this could mean more stable energy prices globally, fewer climate refugees, and potentially slower sea-level rise — though the commitments still fall short of what scientists say is needed to limit warming to 1.5°C.',
    rightPerspective:
      'Conservative outlets emphasize the economic burden on U.S. taxpayers and question whether China will honor its commitments without independent verification. Some argue the deal represents a wealth transfer mechanism dressed up as climate policy, with Fox News and the WSJ highlighting industries that could face job losses during the energy transition.',
    leftPerspective:
      'Progressive outlets call the deal a historic step but criticize the $300 billion figure as woefully inadequate — scientists and advocates have called for at least $1 trillion. The Guardian and MSNBC focus on the suffering of frontline communities and argue the phase-down language on fossil fuels is too weak to meet Paris Agreement goals.',
    category: 'environment',
    imageUrl: 'https://picsum.photos/seed/climate-g20/1200/800',
    tags: ['climate', 'G20', 'renewable energy', 'finance', 'international'],
    hasBiasContrast: true,
    biasScore: -0.1,
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    sources: [
      {
        id: 'src-001-a',
        title: 'G20 leaders agree to triple climate finance in landmark deal',
        description:
          'World leaders at the G20 summit have agreed to a landmark deal tripling climate finance to $300 billion annually to help developing nations.',
        url: 'https://www.theguardian.com/environment/2025/climate-g20-deal',
        imageUrl: 'https://picsum.photos/seed/guardian-climate/800/500',
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        sourceId: 'guardian',
        sourceName: 'The Guardian',
        sourceLean: 'left',
      },
      {
        id: 'src-001-b',
        title: 'G20 strikes climate finance deal after marathon negotiations',
        description:
          'G20 nations have reached a climate finance agreement after intensive negotiations, pledging $300 billion per year by 2035.',
        url: 'https://www.reuters.com/environment/g20-climate-finance',
        imageUrl: 'https://picsum.photos/seed/reuters-climate/800/500',
        publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        sourceId: 'reuters',
        sourceName: 'Reuters',
        sourceLean: 'center',
      },
      {
        id: 'src-001-c',
        title: 'G20 climate deal: What taxpayers will actually pay',
        description:
          'The G20 climate finance pledge raises questions about how much U.S. taxpayers will contribute and whether China will comply.',
        url: 'https://www.foxnews.com/politics/g20-climate-deal-taxpayers',
        imageUrl: 'https://picsum.photos/seed/fox-climate/800/500',
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        sourceId: 'foxnews',
        sourceName: 'Fox News',
        sourceLean: 'right',
      },
      {
        id: 'src-001-d',
        title: 'G20 pledges fall "catastrophically short" of what is needed',
        description:
          'Climate scientists and advocates say the G20\'s $300 billion pledge is a fraction of the $1 trillion annually required to meet Paris Agreement targets.',
        url: 'https://www.npr.org/environment/g20-climate-inadequate',
        imageUrl: 'https://picsum.photos/seed/npr-climate/800/500',
        publishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        sourceId: 'npr',
        sourceName: 'NPR',
        sourceLean: 'left',
      },
    ],
  },

  {
    id: 'story-002',
    headline: 'Federal Judge Blocks AI Hiring Law, Sparking National Debate',
    summary:
      'A federal district court judge in San Francisco has issued a preliminary injunction halting enforcement of the California AI Hiring Transparency Act, a first-of-its-kind law that would have required employers to disclose when artificial intelligence tools are used in hiring decisions and give rejected applicants the right to appeal those decisions.\n\nThe ruling, which surprised legal experts who had expected the law to survive initial challenges, found that the plaintiffs — a coalition of technology companies — had demonstrated a likelihood of success on the merits that the law imposes unconstitutional compelled speech requirements. The state attorney general immediately announced an appeal.\n\nThe case has drawn national attention because more than a dozen other states have similar legislation pending, and federal lawmakers in both parties have been drafting analogous bills. Experts say the ruling could reshape how algorithmic accountability is legislated across the country.',
    whatItMeans:
      'Companies use AI algorithms to screen hundreds of thousands of job applications. These systems can inadvertently discriminate by race, gender, or age because they\'re trained on historical hiring data that reflects past biases. The California law tried to give people more visibility into and recourse against these automated decisions. The court\'s ruling means companies can continue using these tools without disclosure for now — though the legal battle is far from over.',
    category: 'technology',
    imageUrl: 'https://picsum.photos/seed/ai-hiring/1200/800',
    tags: ['AI', 'hiring', 'regulation', 'California', 'courts'],
    hasBiasContrast: false,
    biasScore: 0.2,
    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    sources: [
      {
        id: 'src-002-a',
        title: 'Judge blocks California AI hiring transparency law',
        description:
          'A federal judge has halted California\'s AI hiring disclosure law, ruling that tech companies showed a likelihood of success in their First Amendment challenge.',
        url: 'https://apnews.com/technology/california-ai-hiring-law-blocked',
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        sourceId: 'ap',
        sourceName: 'AP News',
        sourceLean: 'center',
      },
      {
        id: 'src-002-b',
        title: 'Tech industry wins round one against AI accountability law',
        description:
          'A San Francisco judge halted enforcement of California\'s landmark AI hiring law, a win for tech companies who argued the disclosure requirements violate free speech.',
        url: 'https://www.wsj.com/tech/ai-hiring-law-injunction',
        publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        sourceId: 'wsj',
        sourceName: 'Wall Street Journal',
        sourceLean: 'right',
      },
      {
        id: 'src-002-c',
        title: 'Ruling against AI hiring law a setback for workers\' rights',
        description:
          'A federal injunction blocking California\'s AI hiring transparency act is a blow to workers who wanted to know if an algorithm rejected them.',
        url: 'https://www.theguardian.com/technology/ai-hiring-law-ruling',
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        sourceId: 'guardian',
        sourceName: 'The Guardian',
        sourceLean: 'left',
      },
    ],
  },

  {
    id: 'story-003',
    headline: 'Senate Passes Sweeping Healthcare Cost Reduction Act 54–46',
    summary:
      'The United States Senate has passed the American Healthcare Affordability Act, a sweeping bill that would cap insulin prices at $35 per month for all Americans regardless of insurance status, allow Medicare to negotiate drug prices for an expanded list of 50 medications, and establish a federal public option for individuals earning below 400% of the federal poverty line.\n\nThe vote was 54 to 46, with four Republican senators crossing the aisle to support the legislation. The bill now heads to the House, where leadership has promised a vote within two weeks. The White House has signaled the President will sign it if passed.\n\nThe Congressional Budget Office estimates the bill will reduce the federal deficit by $180 billion over ten years while extending healthcare coverage to an additional 12 million Americans. Drug manufacturers have launched a $200 million lobbying campaign against the bill, warning it will reduce investment in new drug development.',
    whatItMeans:
      'If this bill becomes law, the most immediate impact for most people would be lower prescription drug costs — especially for the roughly 37 million Americans with diabetes who rely on insulin. A public option would give uninsured or underinsured Americans a government-run health plan as an alternative to private insurance. The drug industry argues lower profits mean fewer new medicines long-term; proponents counter that the U.S. already pays far more for the same drugs than any other wealthy nation.',
    rightPerspective:
      'Republican commentators and right-leaning outlets frame the bill as a government overreach that will reduce pharmaceutical innovation, warn of rationing similar to government healthcare systems abroad, and question whether the CBO scoring accounts for reduced R&D investment. National Review calls it a "slow nationalization of American medicine."',
    leftPerspective:
      'Progressive voices celebrate the bill but note it doesn\'t go far enough — single-payer advocates argue a patchwork public option still leaves millions behind. MSNBC and the Guardian emphasize stories of patients rationing insulin and the human cost of the status quo, framing the opposition as protecting pharmaceutical profits over lives.',
    category: 'health',
    imageUrl: 'https://picsum.photos/seed/healthcare-senate/1200/800',
    tags: ['healthcare', 'Senate', 'insulin', 'public option', 'legislation'],
    hasBiasContrast: true,
    biasScore: -0.5,
    publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(),
    sources: [
      {
        id: 'src-003-a',
        title: 'Senate passes historic healthcare bill with bipartisan support',
        description:
          'The Senate voted 54–46 to pass the American Healthcare Affordability Act, capping insulin prices and creating a public insurance option.',
        url: 'https://apnews.com/politics/senate-healthcare-bill-passes',
        publishedAt: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(),
        sourceId: 'ap',
        sourceName: 'AP News',
        sourceLean: 'center',
      },
      {
        id: 'src-003-b',
        title: 'GOP senators break ranks on landmark health bill',
        description:
          'Four Republican senators joined Democrats to pass sweeping healthcare reform, a rare show of bipartisan cooperation on one of Congress\'s most divisive issues.',
        url: 'https://www.reuters.com/us/senate-healthcare-bipartisan',
        publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        sourceId: 'reuters',
        sourceName: 'Reuters',
        sourceLean: 'center',
      },
      {
        id: 'src-003-c',
        title: 'Senate healthcare bill: What it means for drug companies',
        description:
          'Drug manufacturers warn the Senate-passed healthcare bill will slash R&D budgets as price negotiation provisions take effect.',
        url: 'https://www.wsj.com/health/senate-healthcare-pharma',
        publishedAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
        sourceId: 'wsj',
        sourceName: 'Wall Street Journal',
        sourceLean: 'right',
      },
      {
        id: 'src-003-d',
        title: 'Millions could gain coverage under Senate health bill',
        description:
          'The American Healthcare Affordability Act would extend coverage to 12 million people, but progressive critics say it doesn\'t go far enough.',
        url: 'https://www.msnbc.com/healthcare/senate-bill-coverage',
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        sourceId: 'msnbc',
        sourceName: 'MSNBC',
        sourceLean: 'left',
      },
      {
        id: 'src-003-e',
        title: 'Senate passes government medicine bill opposed by doctors\' groups',
        description:
          'The Senate health overhaul passed with slim bipartisan support, though major medical associations and the drug industry say it will harm patients long-term.',
        url: 'https://www.foxnews.com/politics/senate-healthcare-bill-opposition',
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        sourceId: 'foxnews',
        sourceName: 'Fox News',
        sourceLean: 'right',
      },
    ],
  },

  {
    id: 'story-004',
    headline: 'NASA's Europa Clipper Detects Possible Organic Molecules in Ocean Plume',
    summary:
      'NASA\'s Europa Clipper spacecraft has made its closest flyby of Jupiter\'s moon Europa, passing just 25 kilometers above the surface and flying directly through a water vapor plume erupting from the icy crust. Early analysis of mass spectrometer data shows complex organic molecules consistent with amino acid precursors — the building blocks of proteins and life as we know it.\n\nScientists caution the findings are preliminary and will require months of detailed analysis before any conclusions can be drawn about the potential for life. The organic molecules detected could also be the result of non-biological chemistry. However, the presence of liquid water, heat from tidal forces, and now potential organic chemistry has made Europa one of the most promising candidates for extraterrestrial life in the solar system.\n\nThe mission team plans three additional close flybys over the next 18 months to collect more data. A potential lander mission, which would drill through the 15–25 km thick ice shell to sample the ocean directly, remains in early feasibility studies at NASA.',
    whatItMeans:
      'Europa has a vast liquid water ocean beneath its frozen surface, kept liquid by the gravitational squeeze of Jupiter\'s gravity. Scientists have long suspected this ocean could harbor microbial life. What the spacecraft found are complex carbon-containing molecules — the kind that, on Earth, are often produced by or needed for life. It\'s not evidence of life itself, but it\'s a significant sign that the chemistry for life might be happening there. The next step would be a much harder mission: landing and drilling through miles of ice.',
    category: 'science',
    imageUrl: 'https://picsum.photos/seed/europa-nasa/1200/800',
    tags: ['NASA', 'Europa', 'space', 'astrobiology', 'Jupiter'],
    hasBiasContrast: false,
    biasScore: 0.0,
    publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 13 * 60 * 60 * 1000).toISOString(),
    sources: [
      {
        id: 'src-004-a',
        title: 'Europa Clipper detects organics in moon\'s water plume',
        description:
          'NASA\'s Europa Clipper has flown through a water vapor plume from Jupiter\'s moon Europa, detecting complex organic molecules that could be precursors to life.',
        url: 'https://apnews.com/science/europa-clipper-organics-detected',
        publishedAt: new Date(Date.now() - 13 * 60 * 60 * 1000).toISOString(),
        sourceId: 'ap',
        sourceName: 'AP News',
        sourceLean: 'center',
      },
      {
        id: 'src-004-b',
        title: 'Could there be life on Europa? NASA\'s new data raises hopes',
        description:
          'Scientists are cautiously excited after the Europa Clipper detected organic molecules during a close flyby of Jupiter\'s icy moon.',
        url: 'https://www.bbc.com/science/europa-clipper-life-hopes',
        publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        sourceId: 'bbc',
        sourceName: 'BBC News',
        sourceLean: 'center',
      },
      {
        id: 'src-004-c',
        title: 'NASA finds organic molecules on Jupiter\'s moon — what it really means',
        description:
          'The Europa Clipper\'s flyby revealed organic chemistry on Jupiter\'s moon, a promising but far from definitive sign of potential habitability.',
        url: 'https://www.npr.org/science/europa-clipper-organic-molecules',
        publishedAt: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString(),
        sourceId: 'npr',
        sourceName: 'NPR',
        sourceLean: 'left',
      },
    ],
  },

  {
    id: 'story-005',
    headline: 'Central Banks Signal Coordinated Rate Cuts Amid Slowdown Fears',
    summary:
      'The Federal Reserve, European Central Bank, and Bank of England have all signaled in closely watched statements this week that they are prepared to cut interest rates more aggressively than previously indicated, citing emerging signs of synchronized global economic slowdown. U.S. unemployment ticked up to 4.4%, while European manufacturing output contracted for a seventh consecutive month.\n\nMarkets surged on the news, with the S&P 500 jumping 2.1% and the Euro Stoxx 50 gaining 1.8%. Bond yields fell sharply as investors priced in multiple rate cuts by year-end. However, economists are divided: some welcome the pivot as necessary stimulus, while others warn that rate cuts now could re-ignite inflation before price stability has been fully achieved.\n\nThe coordinated messaging is unusual and suggests behind-the-scenes communication between major central banks — a pattern last seen during the 2008 financial crisis and the 2020 pandemic shock.',
    whatItMeans:
      'When central banks cut interest rates, borrowing becomes cheaper for everyone — including you. Mortgages, car loans, and credit card rates tend to follow. For people looking to buy a home, this could be meaningful news. For savers, it\'s the opposite: lower returns on savings accounts and CDs. The bigger picture is that central bankers are nervous about the economy slowing down too fast and are trying to cushion the landing, but there\'s a risk they could accidentally fuel another round of inflation if they cut too soon.',
    category: 'business',
    imageUrl: 'https://picsum.photos/seed/central-banks/1200/800',
    tags: ['Federal Reserve', 'ECB', 'interest rates', 'economy', 'inflation'],
    hasBiasContrast: false,
    biasScore: 0.1,
    publishedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 19 * 60 * 60 * 1000).toISOString(),
    sources: [
      {
        id: 'src-005-a',
        title: 'Fed signals readiness to cut rates as slowdown fears mount',
        description:
          'Federal Reserve Chair signals the central bank is prepared to cut rates faster than expected amid rising unemployment and slowing growth.',
        url: 'https://www.reuters.com/business/fed-rate-cut-signals',
        publishedAt: new Date(Date.now() - 19 * 60 * 60 * 1000).toISOString(),
        sourceId: 'reuters',
        sourceName: 'Reuters',
        sourceLean: 'center',
      },
      {
        id: 'src-005-b',
        title: 'Global central banks pivot dovish; markets rally',
        description:
          'Coordinated dovish signals from the Fed, ECB, and Bank of England sent markets surging as investors priced in multiple rate cuts.',
        url: 'https://www.wsj.com/finance/central-bank-pivot-markets',
        publishedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
        sourceId: 'wsj',
        sourceName: 'Wall Street Journal',
        sourceLean: 'right',
      },
      {
        id: 'src-005-c',
        title: 'Rate cuts signal Fed fears recession more than inflation',
        description:
          'The Federal Reserve\'s unexpected openness to rapid rate cuts suggests policymakers see unemployment as the bigger near-term risk.',
        url: 'https://www.axios.com/economy/fed-rate-cut-recession-fear',
        publishedAt: new Date(Date.now() - 17 * 60 * 60 * 1000).toISOString(),
        sourceId: 'axios',
        sourceName: 'Axios',
        sourceLean: 'center',
      },
    ],
  },

  {
    id: 'story-006',
    headline: 'Major Cyberattack Disrupts European Energy Grid Systems',
    summary:
      'A sophisticated cyberattack has disrupted operational technology systems at energy utilities in Germany, France, and Poland, causing brief outages for approximately 2.3 million customers across three countries. European cybersecurity agencies and Europol have launched a joint investigation, with preliminary analysis pointing to a threat actor with links to state-sponsored infrastructure.\n\nThe attack targeted industrial control systems used to manage power distribution — systems that are notoriously difficult to update and patch because any interruption carries the risk of power outages. Utility operators contained the spread within six hours, and no nuclear facilities were affected, but the incident has reignited debate about the cybersecurity vulnerabilities of aging European energy infrastructure.\n\nNATO has invoked its cyber defense protocols and offered technical assistance. The EU\'s newly enacted Critical Infrastructure Protection Regulation, which requires energy operators to meet minimum cybersecurity standards, is being fast-tracked for enforcement review.',
    whatItMeans:
      'Modern power grids are run by computer systems, and those systems can be hacked. Unlike ransomware attacks on companies, attacks on power infrastructure can directly affect people\'s daily lives — heating, hospitals, traffic lights. This incident highlights a known but under-addressed vulnerability: many control systems running our infrastructure were designed decades before cybersecurity was a priority. The geopolitical angle matters too: if the attack is confirmed as state-sponsored, it could trigger a significant diplomatic response from NATO.',
    category: 'world',
    imageUrl: 'https://picsum.photos/seed/energy-cyberattack/1200/800',
    tags: ['cybersecurity', 'Europe', 'energy', 'NATO', 'infrastructure'],
    hasBiasContrast: false,
    biasScore: 0.0,
    publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
    sources: [
      {
        id: 'src-006-a',
        title: 'Cyberattack hits European power grid, millions lose electricity',
        description:
          'A sophisticated cyberattack disrupted power to 2.3 million customers in Germany, France, and Poland, with investigators pointing to state-linked hackers.',
        url: 'https://www.reuters.com/technology/europe-power-grid-cyberattack',
        publishedAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
        sourceId: 'reuters',
        sourceName: 'Reuters',
        sourceLean: 'center',
      },
      {
        id: 'src-006-b',
        title: 'Europe\'s power grid attack: What we know and what it means for security',
        description:
          'The cyberattack on European energy infrastructure exposes longstanding vulnerabilities in critical systems across the continent.',
        url: 'https://www.bbc.com/news/europe-energy-cyberattack',
        publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        sourceId: 'bbc',
        sourceName: 'BBC News',
        sourceLean: 'center',
      },
      {
        id: 'src-006-c',
        title: 'NATO activates cyber defense after Europe power grid attack',
        description:
          'NATO invoked cyber defense protocols after an attack on European energy grids, with member nations offering assistance to affected countries.',
        url: 'https://apnews.com/world/nato-cyber-europe-energy',
        publishedAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
        sourceId: 'ap',
        sourceName: 'AP News',
        sourceLean: 'center',
      },
    ],
  },

  {
    id: 'story-007',
    headline: 'New Study Links Ultra-Processed Foods to 30% Higher Dementia Risk',
    summary:
      'A large-scale study published in the New England Journal of Medicine, tracking 186,000 adults over 15 years, has found that individuals who consumed the highest amounts of ultra-processed foods — defined as industrially formulated products with five or more ingredients including additives, preservatives, and artificial flavors — had a 30% higher risk of developing dementia compared to those with the lowest consumption.\n\nThe association held even after controlling for overall caloric intake, physical activity, smoking, and other known dementia risk factors. Researchers hypothesize that specific additives common in ultra-processed foods, including certain emulsifiers and artificial sweeteners, may contribute to neuroinflammation and changes in gut microbiome composition that affect brain health over time.\n\nThe study has important limitations: it relied on self-reported dietary data collected at a single time point and cannot prove causation. But it adds to a growing body of evidence linking food processing level to multiple health outcomes, and several national health agencies are reviewing whether current dietary guidelines adequately address ultra-processed food consumption.',
    whatItMeans:
      'Ultra-processed foods include most packaged snacks, fast food, soft drinks, ready meals, breakfast cereals, and processed meats — foods that make up a large portion of the average modern diet. This study doesn\'t mean these foods cause dementia, but it does suggest that eating a lot of them, over many years, is associated with meaningfully higher risk. For context, dementia affects 50 million people worldwide. If the association is causal, reducing ultra-processed food consumption could be one of the largest modifiable risk factors for the disease.',
    category: 'health',
    imageUrl: 'https://picsum.photos/seed/food-dementia/1200/800',
    tags: ['dementia', 'nutrition', 'ultra-processed food', 'health', 'study'],
    hasBiasContrast: false,
    biasScore: -0.1,
    publishedAt: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 31 * 60 * 60 * 1000).toISOString(),
    sources: [
      {
        id: 'src-007-a',
        title: 'Ultra-processed food linked to 30% higher dementia risk in major study',
        description:
          'A 15-year study of 186,000 adults found that high ultra-processed food consumption was associated with significantly elevated dementia risk.',
        url: 'https://www.theguardian.com/food/ultra-processed-dementia-study',
        publishedAt: new Date(Date.now() - 31 * 60 * 60 * 1000).toISOString(),
        sourceId: 'guardian',
        sourceName: 'The Guardian',
        sourceLean: 'left',
      },
      {
        id: 'src-007-b',
        title: 'Study: Ultra-processed foods and dementia risk — a closer look',
        description:
          'Researchers caution that while the large new study shows an association between ultra-processed food and dementia, it does not prove causation.',
        url: 'https://apnews.com/health/ultra-processed-food-dementia',
        publishedAt: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
        sourceId: 'ap',
        sourceName: 'AP News',
        sourceLean: 'center',
      },
      {
        id: 'src-007-c',
        title: 'What the new dementia-food study really tells us',
        description:
          'A major new study links processed food to dementia risk, but experts say the findings must be interpreted carefully before changing dietary recommendations.',
        url: 'https://www.npr.org/health/ultra-processed-dementia-science',
        publishedAt: new Date(Date.now() - 29 * 60 * 60 * 1000).toISOString(),
        sourceId: 'npr',
        sourceName: 'NPR',
        sourceLean: 'left',
      },
    ],
  },

  {
    id: 'story-008',
    headline: 'Immigration Reform Bill Stalls in Congress Over Border Dispute',
    summary:
      'A bipartisan immigration reform bill that would have provided a path to legal status for approximately 11 million undocumented immigrants while significantly increasing border security funding has collapsed in the Senate after failing to secure the 60 votes needed to advance. The bill, which had been the product of months of negotiations between a group of six senators, fell apart when the House Republican leadership announced it would not bring the bill to a floor vote.\n\nThe bill would have allocated $40 billion for new border infrastructure, additional immigration judges to reduce an 8-year court backlog, expanded legal immigration pathways for agricultural workers, and provided a 10-year conditional residency pathway — but not citizenship — for those who have been in the country for more than five years.\n\nImmigration advocacy groups condemned the failure, while restrictionist groups celebrated it. With the presidential election now less than 18 months away, most analysts expect immigration to remain a flashpoint rather than see legislative resolution.',
    whatItMeans:
      'Immigration reform has been debated for decades without resolution. This bill was notable because it had rare bipartisan support in the Senate — meaning members of both parties agreed on it — but still failed because of the House. The core disagreement is about sequencing: should enforcement come before or alongside legalization? For the 11 million people living without legal status — many of whom have been in the U.S. for decades, have U.S.-born children, and pay taxes — continued uncertainty means continued risk of deportation and limited economic opportunity.',
    rightPerspective:
      'Conservative and right-leaning outlets frame the bill\'s failure as a correct outcome, arguing that any path to legal status rewards illegal border crossing. Fox News and Breitbart emphasize record border encounter numbers and frame the bill as "amnesty." The primary concern expressed is that legalization creates future incentives for illegal immigration, regardless of the border security provisions included.',
    leftPerspective:
      'Progressive and left-leaning coverage focuses on the human cost — mixed-status families, DACA recipients facing uncertainty, and the economic contribution of undocumented workers. MSNBC and HuffPost blame House Republicans for killing a compromise that included significant border security concessions. The narrative centers on humanitarian failure and political bad faith.',
    category: 'politics',
    imageUrl: 'https://picsum.photos/seed/immigration-congress/1200/800',
    tags: ['immigration', 'Senate', 'border', 'reform', 'Congress'],
    hasBiasContrast: true,
    biasScore: 0.3,
    publishedAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 37 * 60 * 60 * 1000).toISOString(),
    sources: [
      {
        id: 'src-008-a',
        title: 'Bipartisan immigration deal collapses in Senate',
        description:
          'A Senate immigration reform bill fell short of the 60 votes needed to advance after House Republican leadership refused to bring it to a floor vote.',
        url: 'https://apnews.com/politics/senate-immigration-reform-collapses',
        publishedAt: new Date(Date.now() - 37 * 60 * 60 * 1000).toISOString(),
        sourceId: 'ap',
        sourceName: 'AP News',
        sourceLean: 'center',
      },
      {
        id: 'src-008-b',
        title: 'Senate immigration bill dead: What happens next',
        description:
          'The collapse of the bipartisan immigration reform bill leaves millions in legal limbo as prospects for comprehensive reform dim ahead of the election.',
        url: 'https://www.reuters.com/us/senate-immigration-bill-dead',
        publishedAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
        sourceId: 'reuters',
        sourceName: 'Reuters',
        sourceLean: 'center',
      },
      {
        id: 'src-008-c',
        title: 'House Republicans kill immigration compromise',
        description:
          'The bipartisan immigration bill that cleared Senate hurdles collapsed after House GOP leadership torpedoed it, leaving advocates devastated.',
        url: 'https://www.huffpost.com/politics/immigration-bill-republicans-kill',
        publishedAt: new Date(Date.now() - 35 * 60 * 60 * 1000).toISOString(),
        sourceId: 'huffpost',
        sourceName: 'HuffPost',
        sourceLean: 'left',
      },
      {
        id: 'src-008-d',
        title: 'Senate amnesty bill fails: Border hawks declare victory',
        description:
          'The immigration reform bill, which critics called an amnesty measure, failed to advance in the Senate after House Republican opposition made it a non-starter.',
        url: 'https://www.breitbart.com/politics/senate-amnesty-bill-fails',
        publishedAt: new Date(Date.now() - 35 * 60 * 60 * 1000).toISOString(),
        sourceId: 'breitbart',
        sourceName: 'Breitbart',
        sourceLean: 'far-right',
      },
      {
        id: 'src-008-e',
        title: 'Immigration deal failure a political win, governing loss',
        description:
          'The bipartisan immigration reform effort collapsed in Congress, a result that may benefit some politically but leaves the border crisis unresolved.',
        url: 'https://www.axios.com/politics/immigration-reform-failure',
        publishedAt: new Date(Date.now() - 34 * 60 * 60 * 1000).toISOString(),
        sourceId: 'axios',
        sourceName: 'Axios',
        sourceLean: 'center',
      },
    ],
  },

  {
    id: 'story-009',
    headline: 'Wildfire Season Burns 3 Million Acres Across Western North America',
    summary:
      'An unusually early and severe wildfire season has burned more than 3 million acres across the western United States and Canada as of early May, a figure that represents roughly 300% of the five-year average for this date. Climate scientists link the early start to record spring temperatures combined with below-average snowpack that has left forests critically dry.\n\nCalifornia\'s Big Sur corridor, the Canadian province of British Columbia, and eastern Oregon have all declared states of emergency. More than 45,000 people have been evacuated from their homes, and at least 12 firefighters and three civilians have died. Air quality has degraded to hazardous levels in dozens of cities including San Francisco, Portland, and Vancouver.\n\nFederal wildfire management budgets have been restructured following the 2024 Wildfire Response Act, which shifted $8 billion toward prescribed burns and forest thinning — preventive measures that experts say can significantly reduce wildfire severity. However, critics note that decades of fire suppression have left an enormous backlog of overgrown forest that will take generations to address.',
    whatItMeans:
      'Wildfires have become bigger, more frequent, and more destructive because of a combination of climate change — which creates hotter, drier conditions — and a century of fire suppression, which allowed forests to become unnaturally dense. When a fire does start in an overgrown forest, it has far more fuel to consume. The smoke affects not just people near the fires but millions of people hundreds of miles away, contributing to a measurable increase in respiratory disease. The economic costs are enormous: insurance premiums in fire-prone areas have spiked or coverage has been dropped entirely.',
    category: 'environment',
    imageUrl: 'https://picsum.photos/seed/wildfire-west/1200/800',
    tags: ['wildfire', 'California', 'climate change', 'forest', 'emergency'],
    hasBiasContrast: false,
    biasScore: -0.2,
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    sources: [
      {
        id: 'src-009-a',
        title: 'Wildfires burn 3 million acres as western states declare emergencies',
        description:
          'An early and severe wildfire season has scorched more than 3 million acres in the US and Canada, forcing 45,000 evacuations.',
        url: 'https://apnews.com/environment/wildfire-season-western-us',
        publishedAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
        sourceId: 'ap',
        sourceName: 'AP News',
        sourceLean: 'center',
      },
      {
        id: 'src-009-b',
        title: 'Climate change drives record early wildfire season in western North America',
        description:
          'Scientists point to record spring temperatures and low snowpack as climate-linked drivers of an unusually destructive early wildfire season.',
        url: 'https://www.theguardian.com/environment/wildfire-climate-change',
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        sourceId: 'guardian',
        sourceName: 'The Guardian',
        sourceLean: 'left',
      },
      {
        id: 'src-009-c',
        title: 'Western wildfires: Mismanaged forests, not just climate change',
        description:
          'While climate conditions contribute to this year\'s wildfires, decades of poor forest management and fire suppression policy share the blame.',
        url: 'https://www.foxnews.com/environment/wildfires-forest-management',
        publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        sourceId: 'foxnews',
        sourceName: 'Fox News',
        sourceLean: 'right',
      },
    ],
  },
];
