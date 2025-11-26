import { hash, compare, hashMany } from './hash.util';

describe('Hash Util', () => {
  describe('hash', () => {
    it('should hash a string', async () => {
      const value = 'password123';
      const hashed = await hash(value);

      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(value);
      expect(hashed.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for the same input', async () => {
      const value = 'password123';
      const hash1 = await hash(value);
      const hash2 = await hash(value);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('compare', () => {
    it('should return true for matching password and hash', async () => {
      const password = 'password123';
      const hashed = await hash(password);
      const result = await compare(password, hashed);

      expect(result).toBe(true);
    });

    it('should return false for non-matching password and hash', async () => {
      const password = 'password123';
      const wrongPassword = 'wrongpassword';
      const hashed = await hash(password);
      const result = await compare(wrongPassword, hashed);

      expect(result).toBe(false);
    });
  });

  describe('hashMany', () => {
    it('should hash multiple values', async () => {
      const values = ['password1', 'password2', 'password3'];
      const hashed = await hashMany(values);

      expect(hashed).toHaveLength(3);
      expect(hashed[0]).not.toBe(values[0]);
      expect(hashed[1]).not.toBe(values[1]);
      expect(hashed[2]).not.toBe(values[2]);
    });

    it('should return empty array for empty input', async () => {
      const hashed = await hashMany([]);
      expect(hashed).toEqual([]);
    });

    it('should verify all hashed values', async () => {
      const values = ['password1', 'password2', 'password3'];
      const hashed = await hashMany(values);

      const results = await Promise.all([
        compare(values[0], hashed[0]),
        compare(values[1], hashed[1]),
        compare(values[2], hashed[2]),
      ]);

      expect(results).toEqual([true, true, true]);
    });
  });
});
