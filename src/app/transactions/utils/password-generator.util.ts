const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghijkmnopqrstuvwxyz';
const DIGITS = '23456789';
const SYMBOLS = '@#$%&*?';

function randomChar(source: string): string {
  const index = Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / (2 ** 32) * source.length);
  return source[index] ?? source[0];
}

export function generateRandomPassword(length = 12): string {
  const safeLength = Math.min(Math.max(length, 8), 128);
  const required = [
    randomChar(UPPER),
    randomChar(LOWER),
    randomChar(DIGITS),
    randomChar(SYMBOLS),
  ];
  const source = `${UPPER}${LOWER}${DIGITS}${SYMBOLS}`;

  while (required.length < safeLength) {
    required.push(randomChar(source));
  }

  return required
    .map((char) => ({ char, order: crypto.getRandomValues(new Uint32Array(1))[0] }))
    .sort((a, b) => a.order - b.order)
    .map((item) => item.char)
    .join('');
}
