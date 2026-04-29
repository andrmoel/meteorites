import Parser from "./Parser";
import {MeteoritePrice} from "../types/MeteoritePriceTypes";
import axios from "axios";
import * as cheerio from "cheerio";

type CheerioAPI = ReturnType<typeof cheerio.load>;

export default class DeckerMeteoriteParser implements Parser {
    private readonly baseUrl = 'https://www.meteorite-shop.de/meteoriten/';

    async getMeteoritePrices(): Promise<Array<MeteoritePrice>> {
        const results: Array<MeteoritePrice> = [];

        console.log('Fetching page 1...');
        const firstResponse = await axios.get<string>(this.baseUrl, {params: {p: 1, n: 36}});
        let $ = cheerio.load(firstResponse.data);

        results.push(...this.parseProductsFromPage($));
        const lastPage = parseInt($('[data-pages]').attr('data-pages') ?? '1', 10);
        console.log(`Page 1: found ${results.length} meteorites, total pages: ${lastPage}`);

        for (let page = 2; page <= lastPage; page++) {
            console.log(`Fetching page ${page}/${lastPage}...`);
            const response = await axios.get<string>(this.baseUrl, {params: {p: page, n: 36}});
            $ = cheerio.load(response.data);
            const pageItems = this.parseProductsFromPage($);
            results.push(...pageItems);
            console.log(`Page ${page}: found ${pageItems.length} meteorites (total: ${results.length})`);
        }

        console.log(`Done. Total meteorites: ${results.length}`);
        return results;
    }

    private parseProductsFromPage($: CheerioAPI): Array<MeteoritePrice> {
        const meteorites: Array<MeteoritePrice> = [];

        $('div.product--box.box--image').each((_, el) => {
            const title = $(el).find('a.product--title').text().trim();
            const priceText = $(el).find('span.price--default').text().trim();

            // Name format: "Aletai Meteorit als Kugel - 3,70 g" or "... - 45,00 mg"
            const weightMatch = title.match(/-\s*([\d,]+)\s*(mg|g)\s*$/i);
            if (!weightMatch) return;

            const weightValue = parseFloat(weightMatch[1].replace(',', '.'));
            if (isNaN(weightValue)) return;

            const weight = weightMatch[2].toLowerCase() === 'mg' ? weightValue / 1000 : weightValue;

            const price = parseFloat(priceText.replace(/[^\d,]/g, '').replace(',', '.'));
            if (isNaN(price)) return;

            const name = title.slice(0, title.lastIndexOf(' -')).trim();

            meteorites.push({name, weight, price, currency: 'EUR'});
        });

        return meteorites;
    }
}
