import { MfaEntity } from '../src';

describe('Auth Guardian (e2e)', () => {
  describe('@MfaEntity Decorator', () => {
    it('should be defined', () => {
      expect(MfaEntity).toBeDefined();
    });

    it('should be a function', () => {
      expect(typeof MfaEntity).toBe('function');
    });

    it('should return a decorator function', () => {
      const decorator = MfaEntity();
      expect(typeof decorator).toBe('function');
    });
  });
});
