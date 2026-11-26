import type { ModeratorRole, ReportReason } from '../generated/prisma/enums';

// All texts are invented for the demo. They use mild, neutral words and name no real platform.

export const MODERATORS: readonly { username: string; displayName: string; role: ModeratorRole }[] =
  [
    { username: 'mod_aurora', displayName: 'Aurora', role: 'ADMIN' },
    { username: 'mod_birch', displayName: 'Birch', role: 'MODERATOR' },
    { username: 'mod_cedar', displayName: 'Cedar', role: 'MODERATOR' },
    { username: 'mod_dune', displayName: 'Dune', role: 'MODERATOR' },
    { username: 'mod_ember', displayName: 'Ember', role: 'MODERATOR' },
  ];

/** `topics` fill the `{topic}` placeholder of the content texts, so that a text fits its community. */
export const COMMUNITIES: readonly { slug: string; name: string; topics: readonly string[] }[] = [
  {
    slug: 'home-gardening',
    name: 'Home Gardening',
    topics: ['tomato seedlings', 'raised beds', 'compost'],
  },
  { slug: 'budget-travel', name: 'Budget Travel', topics: ['night trains', 'hostels', 'packing'] },
  { slug: 'indie-games', name: 'Indie Games', topics: ['pixel art', 'game jams', 'level design'] },
  {
    slug: 'cooking-basics',
    name: 'Cooking Basics',
    topics: ['knife skills', 'weeknight pasta', 'sourdough'],
  },
  {
    slug: 'urban-cycling',
    name: 'Urban Cycling',
    topics: ['bike locks', 'rainy commutes', 'tyre pressure'],
  },
  {
    slug: 'board-games',
    name: 'Board Games',
    topics: ['co-op games', 'game night', 'card sleeves'],
  },
  {
    slug: 'photography-tips',
    name: 'Photography Tips',
    topics: ['golden hour', 'prime lenses', 'photo editing'],
  },
  {
    slug: 'language-learning',
    name: 'Language Learning',
    topics: ['flashcards', 'speaking practice', 'grammar drills'],
  },
  {
    slug: 'personal-finance-101',
    name: 'Personal Finance 101',
    topics: ['emergency funds', 'monthly budgets', 'index funds'],
  },
  { slug: 'diy-repairs', name: 'DIY Repairs', topics: ['leaky taps', 'squeaky doors', 'shelves'] },
  { slug: 'pet-care', name: 'Pet Care', topics: ['puppy training', 'cat litter', 'aquariums'] },
  {
    slug: 'book-club',
    name: 'Book Club',
    topics: ['mystery novels', 'reading goals', 'audiobooks'],
  },
];

/** The reasons that reported content is written for. `OTHER` appears only as an extra report. */
export type ContentReason = Exclude<ReportReason, 'OTHER'>;

/** Post titles and bodies (of posts and comments) that fit each report reason. */
export const CONTENT_TEXTS: Record<
  ContentReason,
  { titles: readonly string[]; bodies: readonly string[] }
> = {
  SPAM: {
    titles: [
      'Huge discount on {topic} gear, today only',
      'Free {topic} guide, just click the link',
      'The best {topic} deals you will see this week',
    ],
    bodies: [
      'Get 70% off everything for {topic} at our shop. Use code SAVE70 before midnight!',
      'I found a site that gives away free {topic} kits. Sign up at the link in my profile.',
      'Limited offer: the {topic} bundle everyone is talking about. Visit the link now.',
    ],
  },
  OFF_TOPIC: {
    titles: [
      'Anyone watching the match tonight?',
      'Which phone should I buy?',
      'Quick question about car insurance',
    ],
    bodies: [
      'Not really about {topic}, but does anyone know a good car mechanic nearby?',
      'Sorry for the off-topic post: which laptop is best for school this year?',
      'Does anyone else think the new movie was too long?',
    ],
  },
  SELF_PROMOTION: {
    titles: [
      'I wrote the ultimate guide to {topic}',
      'My new video series is all about {topic}',
      'Check out my {topic} course',
    ],
    bodies: [
      'I just launched my paid course on {topic}. Sign up through my link for a discount!',
      'Please follow my blog, I post about {topic} every day.',
      'My shop sells everything for {topic}. Send me a message for a discount code.',
    ],
  },
  LOW_EFFORT: {
    titles: ['{topic}?', 'thoughts', 'help pls'],
    bodies: ['this', 'same', '{topic} lol', 'title says it all'],
  },
  MISLEADING: {
    titles: [
      'Experts say {topic} is now banned everywhere',
      'This one trick makes {topic} completely free',
      'Study proves {topic} doubles your income',
    ],
    bodies: [
      'No source, but trust me on this one about {topic}.',
      'I read somewhere that {topic} will be illegal next month. Share it before it is gone!',
      'Everyone knows {topic} works like magic, no need to check the facts.',
    ],
  },
  RULE_BREAK: {
    titles: [
      'Selling my old {topic} gear, send me a message',
      'Vote for my entry in the {topic} contest',
      'Posting this again because it was removed',
    ],
    bodies: [
      'Selling my {topic} gear here, even though the rules say no sales posts.',
      'Reposting this because my last post was removed for breaking the rules.',
      'I did not read the rules, just tell me the answer about {topic}.',
    ],
  },
};

/** Optional notes that reporters add to a report of each reason. */
export const REPORT_NOTES: Record<ReportReason, readonly string[]> = {
  SPAM: ['The same link is in many threads.', 'Looks like an ad.', 'Posted five times today.'],
  OFF_TOPIC: ['Not related to this community.', 'This belongs in a different community.'],
  SELF_PROMOTION: ['Only posts links to their own site.', 'The account only promotes a shop.'],
  LOW_EFFORT: ['A one-word post.', 'No question and no content.'],
  MISLEADING: ['The title does not match the content.', 'A claim with no source.'],
  RULE_BREAK: ['Sales posts are not allowed here.', 'Breaks rule 3.', 'A repost after removal.'],
  OTHER: [
    'Not sure which rule this breaks, but please take a look.',
    'Something seems wrong here.',
  ],
};

/** Titles of the posts that reported comments reply to. */
export const PARENT_POST_TITLES: readonly string[] = [
  'What are your best tips for {topic}?',
  'Weekly question thread: {topic}',
  'Beginner here: where do I start with {topic}?',
  'Share your {topic} wins this month',
];

/**
 * Removal reasons in their sort order. `reportReason` links a reason to the report reason that it
 * answers: seeded remove and ban actions use the reason that matches the item's main report.
 */
export const REMOVAL_REASONS: readonly {
  title: string;
  messageTemplate: string;
  reportReason?: ContentReason;
}[] = [
  {
    title: 'Spam',
    messageTemplate:
      'Hi {{username}}, we removed your content from {{community}}. Reason: {{reason}}. Please do not post ads or repeat the same link.',
    reportReason: 'SPAM',
  },
  {
    title: 'Off-topic',
    messageTemplate:
      'Hi {{username}}, we removed your content from {{community}}. Reason: {{reason}}. Please post it in a community that fits the subject.',
    reportReason: 'OFF_TOPIC',
  },
  {
    title: 'Self-promotion',
    messageTemplate:
      'Hi {{username}}, we removed your content from {{community}}. Reason: {{reason}}. Links to your own work are welcome only in the weekly thread.',
    reportReason: 'SELF_PROMOTION',
  },
  {
    title: 'Low effort',
    messageTemplate:
      'Hi {{username}}, we removed your content from {{community}}. Reason: {{reason}}. Please add details so that others can answer.',
    reportReason: 'LOW_EFFORT',
  },
  {
    title: 'Misleading title',
    messageTemplate:
      'Hi {{username}}, we removed your content from {{community}}. Reason: {{reason}}. Please use a title that matches the content and add a source for claims.',
    reportReason: 'MISLEADING',
  },
  {
    title: 'Breaks community rules',
    messageTemplate:
      'Hi {{username}}, we removed your content from {{community}}. Reason: {{reason}}. Please read the community rules before you post again.',
    reportReason: 'RULE_BREAK',
  },
  {
    title: 'Duplicate post',
    messageTemplate:
      'Hi {{username}}, we removed your content from {{community}}. Reason: {{reason}}. Please add to the existing thread instead.',
  },
  {
    title: 'Personal information',
    messageTemplate:
      'Hi {{username}}, we removed your content from {{community}}. Reason: {{reason}}. Please do not share contact details or other personal information.',
  },
];
