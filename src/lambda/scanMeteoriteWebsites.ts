import getMeteoritePrices from "../services/priceParser/getMeteoritePrices";
import cleanData from "../services/dataCleaner/cleanData";

export default async function scanMeteoriteWebsites(): Promise<void> {
    const prices = await getMeteoritePrices();

    const result = cleanData(prices);

    console.log(`Found ${result.length} meteorites.`);

    const sorted = result.sort((a, b) => (b.pricePerGramm ?? 0) - (a.pricePerGramm ?? 0));

    console.log(sorted);
}
