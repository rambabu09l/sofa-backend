import { randomUUID } from 'crypto';
import { toDeletedCode } from '../deleted-code';

const CODE_COLUMN_LENGTH = 40;

describe('toDeletedCode', () => {
  it('fits the VARCHAR(40) code column for a UUID row id', () => {
    expect(toDeletedCode(randomUUID()).length).toBeLessThanOrEqual(
      CODE_COLUMN_LENGTH,
    );
  });

  it('fits the code column for a numeric row id', () => {
    expect(toDeletedCode('18446744073709551615').length).toBeLessThanOrEqual(
      CODE_COLUMN_LENGTH,
    );
  });

  it('is unique per row id', () => {
    expect(toDeletedCode('1')).not.toBe(toDeletedCode('2'));
    expect(toDeletedCode('1')).toBe('DEL_1');
  });
});
