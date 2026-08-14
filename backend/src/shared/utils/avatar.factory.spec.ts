import { buildAvatarUrl, buildInitials, stableHash } from './avatar.factory';

describe('avatar factory', () => {
  it('returns the same portrait for the same seed', () => {
    expect(buildAvatarUrl('priya@pyramid.app')).toBe(buildAvatarUrl('priya@pyramid.app'));
  });

  it('ignores casing and surrounding whitespace', () => {
    expect(buildAvatarUrl('  Priya@Pyramid.app ')).toBe(buildAvatarUrl('priya@pyramid.app'));
  });

  it('gives different members visibly different portraits', () => {
    const seeds = ['dexter@pyramid.app', 'priya@pyramid.app', 'marco@pyramid.app', 'anais@pyramid.app'];
    const urls = new Set(seeds.map((seed) => buildAvatarUrl(seed)));

    expect(urls.size).toBe(seeds.length);
  });

  it('falls back to a usable seed when given an empty string', () => {
    expect(buildAvatarUrl('')).toContain('seed=anonymous');
  });

  it('hashes deterministically', () => {
    expect(stableHash('pyramid')).toBe(stableHash('pyramid'));
    expect(stableHash('pyramid')).not.toBe(stableHash('pyramld'));
  });

  describe('initials', () => {
    it.each([
      ['Dexter Rowe', 'DR'],
      ['priya', 'PR'],
      ['Anais Marie Dubois', 'AD'],
      ['   ', '?'],
    ])('renders %s as %s', (input, expected) => {
      expect(buildInitials(input)).toBe(expected);
    });
  });
});
