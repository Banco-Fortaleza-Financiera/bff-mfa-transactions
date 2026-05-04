import { generateRandomPassword } from './password-generator.util';

describe('generateRandomPassword', () => {
  const originalCrypto = globalThis.crypto;

  afterEach(() => {
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: originalCrypto,
    });
  });

  it('generates a password with the requested length and required character groups', () => {
    let value = 0;
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: {
        getRandomValues: (array: Uint32Array) => {
          array[0] = value;
          value += 100000;
          return array;
        },
      },
    });

    const password = generateRandomPassword(12);

    expect(password).toHaveLength(12);
    expect(password).toMatch(/[A-Z]/);
    expect(password).toMatch(/[a-z]/);
    expect(password).toMatch(/[2-9]/);
    expect(password).toMatch(/[@#$%&*?]/);
  });

  it('limits very short and very long lengths', () => {
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: {
        getRandomValues: (array: Uint32Array) => {
          array[0] = 0;
          return array;
        },
      },
    });

    expect(generateRandomPassword(2)).toHaveLength(8);
    expect(generateRandomPassword(200)).toHaveLength(128);
  });
});
