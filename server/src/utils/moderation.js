// Lightweight, dependency-free moderation for anything a STUDENT sends.
// Strategy (recommended for K-5):
//   1) Auto-filter: scan for a blocklist of profanity, bullying language,
//      personal-info patterns (phone, email, address hints), and external links.
//   2) Route the message into a teacher review queue with status 'pending'
//      (clean) or 'flagged' (tripped a rule). Nothing reaches the recipient
//      until a teacher approves it. This is a "review-before-delivery" model,
//      which is the safest posture for young children.
//
// In production you would swap/augment this with a hosted moderation API
// (e.g. a perspective/toxicity classifier) - the interface stays the same.

const PROFANITY = [
  'damn', 'hell', 'crap', 'stupid', 'idiot', 'shut up', 'hate you', 'dumb',
  'loser', 'jerk', 'ugly', 'kill', 'die',
];

// Very rough personal-information detectors.
const PATTERNS = [
  { key: 'phone', re: /\b(\+?\d[\d\-\s().]{7,}\d)\b/ },
  { key: 'email', re: /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/ },
  { key: 'link', re: /\b(https?:\/\/|www\.)\S+/i },
  { key: 'address', re: /\b\d{1,5}\s+([A-Za-z]+\s){1,3}(street|st|road|rd|ave|avenue|lane|ln|drive|dr|blvd)\b/i },
];

export function screenText(text) {
  const lower = String(text).toLowerCase();
  const flaggedTerms = [];

  for (const word of PROFANITY) {
    if (lower.includes(word)) flaggedTerms.push(word);
  }
  for (const { key, re } of PATTERNS) {
    if (re.test(text)) flaggedTerms.push(key);
  }

  const clean = flaggedTerms.length === 0;
  return {
    clean,
    flaggedTerms,
    // 'pending' = clean but still needs teacher approval before delivery.
    // 'flagged' = tripped a rule; teacher sees it highlighted.
    status: clean ? 'pending' : 'flagged',
  };
}
