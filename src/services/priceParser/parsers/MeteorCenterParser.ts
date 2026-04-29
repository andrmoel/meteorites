import Parser from "./Parser";
import {MeteoritePrice} from "../types/MeteoritePriceTypes";
import axios from "axios";
import * as cheerio from "cheerio";

type CheerioAPI = ReturnType<typeof cheerio.load>;

export default class MeteorCenterParser implements Parser {
    private readonly baseUrl = 'https://meteor-center.com';

    async getMeteoritePrices(): Promise<Array<MeteoritePrice>> {
        const results: Array<MeteoritePrice> = [];

        console.log('Fetching page 1...');
        const firstResponse = await axios.get<string>(this.baseUrl);
        let $ = cheerio.load(firstResponse.data);

        results.push(...this.parseProductsFromPage($));
        const lastPage = this.getLastPageNumber($);
        console.log(`Page 1: found ${results.length} meteorites, total pages: ${lastPage}`);

        for (let page = 2; page <= lastPage; page++) {
            console.log(`Fetching page ${page}...`);
            const response = await axios.get<string>(`${this.baseUrl}/page/${page}/`);
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

        $('li.product').each((_, el) => {
            const title = $(el).find('h2.woocommerce-loop-product__title').text().trim();
            const priceText = $(el).find('.woocommerce-Price-amount bdi').first().text().trim();

            const weightMatch = title.match(/(\d+(?:[.,]\d+)?)g(?:\s|$|,)/i);
            if (!weightMatch) return;

            const weight = parseFloat(weightMatch[1].replace(',', '.'));
            if (isNaN(weight)) return;

            const price = parseFloat(priceText.replace(/[^\d.]/g, ''));
            if (isNaN(price)) return;

            // Name is everything before the ' – ' separator
            const dashIndex = title.indexOf(' \u2013 ');
            const name = dashIndex !== -1 ? title.slice(0, dashIndex).trim() : title;

            meteorites.push({name, weight, price});
        });

        return meteorites;
    }

    private getLastPageNumber($: CheerioAPI): number {
        let max = 1;
        $('a.page-numbers').each((_, el) => {
            const num = parseInt($( el).text().trim(), 10);
            if (!isNaN(num) && num > max) max = num;
        });
        return max;
    }
}
