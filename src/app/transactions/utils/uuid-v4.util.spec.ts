import { generateUuidV4 } from './uuid-v4.util';

describe('generateUuidV4', () => {
  const originalCrypto = globalThis.crypto;

  afterEach(() => {
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: originalCrypto,
    });
  });

  it('uses crypto.randomUUID when it is available', () => {
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: {
        randomUUID: () => '11111111-1111-4111-8111-111111111111',
      },
    });

    expect(generateUuidV4()).toBe('11111111-1111-4111-8111-111111111111');
  });

  it('creates a valid uuid v4 with getRandomValues as fallback', () => {
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: {
        getRandomValues: (array: Uint8Array) => {
          array[0] = 10;
          return array;
        },
      },
    });

    expect(generateUuidV4()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
  });
});
