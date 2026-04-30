import getMeteoriteWebsitePrices from "../services/meteoriteWebsiteParser/getMeteoriteWebsitePrices";
import getDailyMeteoritePricesReport from "../services/dailyReport/getDailyMeteoritePricesReport";
import getDailyMeteoritePricesReportRepository from "../repositories/getDailyMeteoritePricesReportRepository";

export async function handler(): Promise<void> {
    const websitePrices = await getMeteoriteWebsitePrices();

    console.log(`Found ${websitePrices.length} meteorites.`);

    const report = await getDailyMeteoritePricesReport(websitePrices);

    await getDailyMeteoritePricesReportRepository().putAll(report);
}
