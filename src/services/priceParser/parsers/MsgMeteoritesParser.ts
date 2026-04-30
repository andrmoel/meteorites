import Parser from "./Parser";
import {MeteoritePrice} from "../types/MeteoritePriceTypes";
import axios from "axios";
import * as cheerio from "cheerio";
import {Currency} from "../../currency/enums/Currency";

type CheerioAPI = ReturnType<typeof cheerio.load>;

const BASE_URL = 'https://msg-meteorites.co.uk';
const LISTING_URL = `${BASE_URL}/product-category/meteorites/show-all-meteorites`;

export default class MsgMeteoritesParser implements Parser {
    async getMeteoritePrices(): Promise<Array<MeteoritePrice>> {
        const results: Array<MeteoritePrice> = [];

        const firstResponse = await axios.get<string>(LISTING_URL);
        let $ = cheerio.load(firstResponse.data);

        results.push(...this.parseProductsFromPage($));
        const lastPage = this.getLastPageNumber($);

        for (let page = 2; page <= lastPage; page++) {
            const response = await axios.get<string>(`${LISTING_URL}/page/${page}/`);
            $ = cheerio.load(response.data);
            results.push(...this.parseProductsFromPage($));
        }

        return results;
    }

    private parseProductsFromPage($: CheerioAPI): Array<MeteoritePrice> {
        const meteorites: Array<MeteoritePrice> = [];

        $('li.product').each((_, el) => {
            const name = $(el).find('h2.woocommerce-loop-product__title').text().trim();

            // Weight embedded in name, e.g. "weighing 64g", "weighing 274 grams", "884 grams Individual"
            const weightMatch = name.match(/(\d+(?:\.\d+)?)\s*(kg|g(?:rams?)?)\b/i);
            if (!weightMatch) return;

            const weightValue = parseFloat(weightMatch[1]);
            const weight = weightMatch[2].toLowerCase() === 'kg' ? weightValue * 1000 : weightValue;
            if (isNaN(weight) || weight <= 0) return;

            // Use last price amount to pick up the sale price when applicable
            const priceText = $(el).find('.woocommerce-Price-amount bdi').last().text().trim();
            if (!priceText) return;
            const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
            if (isNaN(price) || price <= 0) return;

            meteorites.push({name, weight, price, currency: Currency.GBP});
        });

        return meteorites;
    }

    private getLastPageNumber($: CheerioAPI): number {
        let max = 1;
        $('a.page-numbers').each((_, el) => {
            const num = parseInt($(el).text().trim(), 10);
            if (!isNaN(num) && num > max) max = num;
        });
        return max;
    }
}
