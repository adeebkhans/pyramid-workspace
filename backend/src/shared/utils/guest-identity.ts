import { randomBytes } from 'node:crypto';

/**
 * Every guest session gets its own member record, identified by a generated
 * name and address. Two people trying the demo at the same time therefore see
 * their own name, their own avatar and their own authorship on comments, which
 * is what makes a guest mode worth showing to someone.
 */

const ADJECTIVES = [
  'Amber',
  'Cobalt',
  'Crimson',
  'Ivory',
  'Jade',
  'Lilac',
  'Onyx',
  'Saffron',
  'Slate',
  'Teal',
] as const;

const CREATURES = [
  'Falcon',
  'Heron',
  'Ibex',
  'Lynx',
  'Marten',
  'Osprey',
  'Otter',
  'Puffin',
  'Sable',
  'Wren',
] as const;

export interface GuestIdentity {
  displayName: string;
  email: string;
  handle: string;
}

export function mintGuestIdentity(): GuestIdentity {
  const entropy = randomBytes(4);
  const adjective = ADJECTIVES[entropy[0] % ADJECTIVES.length];
  const creature = CREATURES[entropy[1] % CREATURES.length];
  const discriminator = entropy.readUInt16BE(2).toString(36).padStart(3, '0');

  const handle = `${adjective}${creature}${discriminator}`.toLowerCase();

  return {
    displayName: `${adjective} ${creature}`,
    email: `${handle}@guest.pyramid.app`,
    handle,
  };
}
