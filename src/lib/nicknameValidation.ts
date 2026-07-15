const forbiddenPatterns = [
  /бля(?:д|т)/,
  /(?:^|[^а-я])бля(?:$|[^а-я])/,
  /(?:^|[^а-я])хуй/,
  /хуе/,
  /хуё/,
  /пизд/,
  /еба/,
  /ёба/,
  /(?:^|[^а-я])еб/,
  /(?:^|[^а-я])ёб/,
  /мудак/,
  /долбоеб/,
  /долбоёб/,
  /шлюх/,
  /сука/,
  /гандон/,
  /пидор/,
  /педик/,
  /nigg/,
  /fuck/,
  /bitch/,
  /whore/,
  /cunt/,
];

const lookalikes: Record<string, string> = {
  '0': 'о', '1': 'и', '3': 'з', '4': 'ч', '6': 'б', '@': 'а', '$': 'с',
  a: 'а', b: 'в', c: 'с', e: 'е', h: 'н', k: 'к', m: 'м', o: 'о', p: 'р',
  t: 'т', x: 'х', y: 'у',
};

function normalizeNickname(nickname: string) {
  return nickname
    .toLowerCase()
    .split('')
    .map((character) => lookalikes[character] ?? character)
    .join('')
    .replace(/(.)\1{2,}/g, '$1')
    .replace(/[\s_.\-]+/g, '');
}

export function hasForbiddenWords(nickname: string) {
  const normalized = normalizeNickname(nickname);
  const compactOriginal = nickname.toLowerCase().replace(/[\s_.\-]+/g, '');
  return forbiddenPatterns.some((pattern) => pattern.test(normalized) || pattern.test(compactOriginal));
}
