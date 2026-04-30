import cleanMeteoriteName from './cleanMeteoriteName';

it('removes content in parentheses', () => {
    expect(cleanMeteoriteName('FOO (bla)')).toBe('Foo');
});

it('removes classification in parentheses', () => {
    expect(cleanMeteoriteName('NWA 1234 (L6)')).toBe('NWA 1234');
});

it('trims leading and trailing whitespace', () => {
    expect(cleanMeteoriteName('  Allende (CV3)  ')).toBe('Allende');
});

it('leaves names without parentheses unchanged', () => {
    expect(cleanMeteoriteName('No parens')).toBe('No parens');
});

it('removes multiple parenthesised groups', () => {
    expect(cleanMeteoriteName('Multiple (foo) parts (bar)')).toBe('Multiple parts');
});

it('replaces "North West Africa" with "NWA"', () => {
    expect(cleanMeteoriteName('North West Africa 1234')).toBe('NWA 1234');
});

it('replaces "Nord West Africa" with "NWA"', () => {
    expect(cleanMeteoriteName('Nord West Africa 5678')).toBe('NWA 5678');
});

it('replaces "Northwest Africa" with "NWA"', () => {
    expect(cleanMeteoriteName('Northwest Africa 1234')).toBe('NWA 1234');
});

it('removes the word "meteorite"', () => {
    expect(cleanMeteoriteName('Allende meteorite')).toBe('Allende');
});

it('removes "meteorite" case-insensitively', () => {
    expect(cleanMeteoriteName('Allende Meteorite')).toBe('Allende');
});

it('removes words containing "meteorite" (e.g. "meteorites")', () => {
    expect(cleanMeteoriteName('Allende meteorites')).toBe('Allende');
});

it('removes meteorite word in the middle of a name', () => {
    expect(cleanMeteoriteName('Allende meteorite 1234')).toBe('Allende 1234');
});

it('removes the word "meteorit"', () => {
    expect(cleanMeteoriteName('Allende meteorit')).toBe('Allende');
});

it('removes words containing "meteorit" (e.g. "Meteoriten")', () => {
    expect(cleanMeteoriteName('Allende Meteoriten')).toBe('Allende');
});

it('removes the word "mond"', () => {
    expect(cleanMeteoriteName('Allende Mond')).toBe('Allende');
});

it('removes words containing "mond" (e.g. "mondstein")', () => {
    expect(cleanMeteoriteName('Allende Mondstein')).toBe('Allende');
});

it('removes the word "lunar"', () => {
    expect(cleanMeteoriteName('Allende lunar')).toBe('Allende');
});

it('removes words containing "lunar" (e.g. "lunar-a")', () => {
    expect(cleanMeteoriteName('Allende lunar-a')).toBe('Allende');
});

it('removes the word "mars"', () => {
    expect(cleanMeteoriteName('Allende mars')).toBe('Allende');
});

it('removes words containing "mars" (e.g. "marsstein")', () => {
    expect(cleanMeteoriteName('Allende Marsstein')).toBe('Allende');
});

it('removes the word "moon"', () => {
    expect(cleanMeteoriteName('Allende moon')).toBe('Allende');
});

it('removes words containing "moon" (e.g. "moonrock")', () => {
    expect(cleanMeteoriteName('Allende moonrock')).toBe('Allende');
});

it('removes "- Main Mass -" suffix', () => {
    expect(cleanMeteoriteName('NWA 6846 - Main Mass -')).toBe('NWA 6846');
});

it('removes "- Main Mass" suffix without trailing dash', () => {
    expect(cleanMeteoriteName('NWA 6846 - Main Mass')).toBe('NWA 6846');
});

it('removes leading number', () => {
    expect(cleanMeteoriteName('4 NWA XXX')).toBe('NWA Xxx');
});

it('removes trailing dash', () => {
    expect(cleanMeteoriteName('NWA XXX -')).toBe('NWA Xxx');
});

it('removes leading number and trailing dash', () => {
    expect(cleanMeteoriteName('4 NWA XXX -')).toBe('NWA Xxx');
});

it('converts uppercase name to title case', () => {
    expect(cleanMeteoriteName('ERG CHECH 002')).toBe('Erg Chech 002');
});

it('keeps NWA uppercase', () => {
    expect(cleanMeteoriteName('NWA 1234')).toBe('NWA 1234');
});

it('removes special characters', () => {
    expect(cleanMeteoriteName('NWA 1234 #5')).toBe('NWA 1234 5');
});

it('removes slash', () => {
    expect(cleanMeteoriteName('NWA 1234/5')).toBe('NWA 12345');
});

it('keeps letters and numbers', () => {
    expect(cleanMeteoriteName('Allende 12')).toBe('Allende 12');
});
