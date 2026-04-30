export default function cleanMeteoriteName(name: string): string {
    return name
        .replace(/\s*\([^)]*\)/g, '') // remove parenthesised classifications, e.g. "(L6)"
        .replace(/\bNor[dt]h?\s*West\s+Africa\b/gi, 'NWA') // normalise "North/Nord West Africa" → "NWA"
        .replace(/\S*(meteorit|mond|lunar|mars|moon|individual|complete|stone|slice|fragment)\S*/gi, '') // remove descriptive words
        .replace(/\s*-\s*Main\s+Mass\b.*/gi, '') // remove "- Main Mass" suffix and everything after
        .replace(/^\d+\s+/, '') // remove leading catalogue number, e.g. "4 NWA XXX" → "NWA XXX"
        .replace(/\s*-+\s*$/, '') // remove trailing dashes
        .replace(/[|\-\/(\[\]),.#~+*!?].*$/, '') // strip everything from the first special character onwards, e.g. "Bechar 003/006" → "Bechar 003"
        .replace(/[^\p{L}\p{N}\s]/gu, '') // remove remaining special characters (apostrophes, hyphens, etc.)
        .replace(/\s+/g, ' ') // collapse multiple spaces into one
        .replace(/(\d+)\s+\S*[a-zA-Z].*$/, '$1') // strip any text after the last catalogue number, e.g. "NWA 17101 398g" → "NWA 17101"
        .replace(/\b([A-Z]{2,})\b/g, (word) => word === 'NWA' || word === 'NEA' ? word : word[0] + word.slice(1).toLowerCase()) // title-case ALL-CAPS words, keeping NWA/NEA uppercase
        .trim();
}
