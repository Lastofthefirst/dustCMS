// XKCD-style password generator (https://xkcd.com/936/)
// Generates memorable 4-word passphrases like: correct-horse-battery-staple

const wordList = [
  'ability', 'absence', 'academy', 'account', 'acoustic', 'action', 'active', 'actor',
  'address', 'advance', 'adverse', 'advice', 'airport', 'alcohol', 'ancient', 'animal',
  'anxiety', 'anybody', 'apple', 'archive', 'arrange', 'article', 'assault', 'athlete',
  'attempt', 'attract', 'auction', 'average', 'balance', 'balloon', 'banking', 'battery',
  'bedroom', 'benefit', 'bicycle', 'blanket', 'bombing', 'bottle', 'brother', 'browser',
  'budget', 'buffalo', 'builder', 'burning', 'cabinet', 'caliber', 'camera', 'camping',
  'capable', 'capital', 'capture', 'cardiac', 'carrier', 'catalog', 'ceiling', 'century',
  'chamber', 'channel', 'chapter', 'charity', 'charter', 'chicken', 'circuit', 'classic',
  'climate', 'closing', 'clothes', 'coastal', 'coconut', 'collect', 'college', 'combine',
  'command', 'comment', 'compact', 'company', 'compare', 'compete', 'complex', 'concept',
  'concern', 'concert', 'conduct', 'confirm', 'connect', 'consent', 'consist', 'contact',
  'contain', 'content', 'contest', 'context', 'control', 'convert', 'cooking', 'correct',
  'council', 'counter', 'country', 'courage', 'crystal', 'culture', 'current', 'cutting',
  'dancing', 'dealing', 'decline', 'default', 'defense', 'deliver', 'density', 'deposit',
  'desktop', 'destroy', 'develop', 'diamond', 'digital', 'diploma', 'disable', 'discuss',
  'display', 'dispute', 'diverse', 'drawing', 'edition', 'elderly', 'elegant', 'element',
  'emperor', 'enhance', 'evening', 'exactly', 'example', 'excited', 'exclude', 'execute',
  'exhibit', 'explain', 'explore', 'extract', 'extreme', 'faculty', 'failure', 'fashion',
  'feature', 'federal', 'fiction', 'fifteen', 'finance', 'finding', 'fishing', 'fitness',
  'foreign', 'forever', 'formula', 'fortune', 'forward', 'founder', 'freedom', 'further',
  'gallery', 'garbage', 'gateway', 'general', 'genetic', 'genuine', 'giraffe', 'glacier',
  'granite', 'gravity', 'grocery', 'habitat', 'handful', 'harmony', 'harvest', 'heading',
  'healthy', 'hearing', 'history', 'holiday', 'horizon', 'hormone', 'hosting', 'housing',
  'however', 'hundred', 'hunting', 'husband', 'imagine', 'improve', 'include', 'inflict',
  'initial', 'inquiry', 'insight', 'inspire', 'install', 'instant', 'instead', 'integer',
  'inverse', 'involve', 'journey', 'justice', 'kitchen', 'knowled', 'ladder', 'landing',
  'largest', 'lasting', 'leading', 'learned', 'leather', 'lecture', 'legacy', 'leisure',
  'liberty', 'library', 'license', 'limited', 'linking', 'listing', 'literal', 'logical',
  'machine', 'maintain', 'manager', 'mandate', 'mansion', 'mapping', 'maritime', 'married',
  'massive', 'maximum', 'meaning', 'measure', 'medical', 'meeting', 'mention', 'message',
  'minimum', 'mission', 'mistake', 'mixture', 'monitor', 'monster', 'monthly', 'morning',
  'musical', 'mystery', 'natural', 'neither', 'network', 'neutral', 'nothing', 'nuclear',
  'nursery', 'obvious', 'offense', 'officer', 'ongoing', 'opening', 'operate', 'opinion',
  'optimal', 'options', 'oranges', 'organic', 'outcome', 'outline', 'outlook', 'overall',
  'package', 'painter', 'parking', 'partial', 'partner', 'passage', 'passion', 'passive',
  'patient', 'pattern', 'payment', 'peasant', 'penalty', 'pension', 'percent', 'perfect',
  'perform', 'perhaps', 'picture', 'pioneer', 'plastic', 'plateau', 'platform', 'playing',
  'popular', 'portion', 'possess', 'pottery', 'poverty', 'powder', 'prairie', 'precise',
  'predict', 'premier', 'prepare', 'present', 'prevent', 'preview', 'primary', 'printer',
  'privacy', 'private', 'problem', 'proceed', 'process', 'produce', 'product', 'profile',
  'program', 'project', 'promise', 'promote', 'propose', 'protect', 'protein', 'protest',
  'provide', 'publish', 'purpose', 'qualify', 'quality', 'quarter', 'radical', 'railway',
  'rainbow', 'ranking', 'rapidly', 'readily', 'reality', 'realize', 'receipt', 'receive',
  'recover', 'reflect', 'refugee', 'refusal', 'regular', 'related', 'release', 'remains',
  'removed', 'renewal', 'replace', 'replica', 'request', 'require', 'reserve', 'resolve',
  'respect', 'respond', 'restore', 'retreat', 'revenge', 'revenue', 'reverse', 'rollback',
  'routine', 'royalty', 'running', 'satisfy', 'scatter', 'science', 'scratch', 'section',
  'segment', 'serious', 'service', 'session', 'setting', 'seventh', 'several', 'shelter',
  'shortly', 'shrimp', 'silence', 'silicon', 'similar', 'sixteen', 'smoking', 'society',
  'soldier', 'someone', 'speaker', 'special', 'specify', 'sponsor', 'squeeze', 'stadium',
  'stanley', 'station', 'storage', 'strange', 'stretch', 'student', 'subject', 'subsidy',
  'succeed', 'suggest', 'summary', 'support', 'suppose', 'supreme', 'surface', 'surplus',
  'surgery', 'surplus', 'survive', 'suspect', 'sustain', 'teacher', 'teaspoon', 'tension',
  'theater', 'therapy', 'through', 'tonight', 'towards', 'traffic', 'trailer', 'trained',
  'transit', 'trigger', 'triumph', 'trouble', 'tropical', 'turning', 'typical', 'ultimately',
  'uniform', 'unknown', 'unusual', 'upgrade', 'variety', 'venture', 'version', 'veteran',
  'victory', 'village', 'vintage', 'violent', 'virtual', 'visible', 'visitor', 'voltage',
  'warning', 'warrior', 'weather', 'website', 'wedding', 'weekend', 'welcome', 'welfare',
  'western', 'whether', 'whisper', 'willing', 'wisdom', 'witness', 'working', 'worship',
  'writing', 'younger',
];

export function generatePassphrase(wordCount: number = 4): string {
  const words: string[] = [];

  for (let i = 0; i < wordCount; i++) {
    const randomIndex = Math.floor(Math.random() * wordList.length);
    words.push(wordList[randomIndex]);
  }

  return words.join('-');
}

export function generateStrongPassword(length: number = 16): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';

  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return password;
}
