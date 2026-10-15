import { checkImageReferences } from '../checkImageReferences';
import { mkParsed, mkWordRow, mkInventory } from '../../__tests__/testHelpers';

const orphans = (issues: ReturnType<typeof checkImageReferences>) =>
  issues.filter((i) => i.code === 'ORPHAN_IMAGE_FILE').map((i) => i.context?.['file']);

describe('checkImageReferences — orphan images', () => {
  it('does not flag a referenced LWC that ends in 2 (yue zz_2)', () => {
    const parsed = mkParsed({ wordRows: [mkWordRow({ wordInLWC: 'zz_2', wordInLOP: '二' })] });
    const issues = checkImageReferences(parsed, mkInventory({ wordImages: ['zz_2'] }));
    expect(orphans(issues)).toEqual([]);
  });

  it('accepts the <lwc>2 distractor variant of a referenced word', () => {
    const parsed = mkParsed({ wordRows: [mkWordRow({ wordInLWC: 'cat', wordInLOP: 'cat' })] });
    const issues = checkImageReferences(parsed, mkInventory({ wordImages: ['cat', 'cat2'] }));
    expect(orphans(issues)).toEqual([]);
  });

  it('still flags a genuinely unreferenced image', () => {
    const parsed = mkParsed({ wordRows: [mkWordRow({ wordInLWC: 'cat', wordInLOP: 'cat' })] });
    const issues = checkImageReferences(parsed, mkInventory({ wordImages: ['cat', 'dog'] }));
    expect(orphans(issues)).toEqual(['dog']);
  });
});
