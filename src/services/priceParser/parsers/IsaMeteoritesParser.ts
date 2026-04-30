import {MeteoritePrice} from "../types/MeteoritePriceTypes";
import Parser from "./Parser";
import axios from "axios";
import * as cheerio from "cheerio";
import {Currency} from "../../currency/enums/Currency";

type CheerioAPI = ReturnType<typeof cheerio.load>;

const STORE_URL = 'https://www.isameteorites.com/en/store/';

export default class IsaMeteoritesParser implements Parser {
    async getMeteoritePrices(): Promise<Array<MeteoritePrice>> {
        const response = await axios.get<string>(STORE_URL);
        const $ = cheerio.load(response.data);
        return this.parseProductsFromPage($);
    }

    private parseProductsFromPage($: CheerioAPI): Array<MeteoritePrice> {
        const meteorites: Array<MeteoritePrice> = [];

        $('div.card.eco-item').each((_, el) => {
            const fullName = $(el).find('p.media-heading a').first().text().trim();

            // Name format: "NEA 104 slice 8.7g" or "Amgala 001 individual 0.8g"
            const weightMatch = fullName.match(/(\d+(?:\.\d+)?)\s*(kg|g)\s*$/i);
            if (!weightMatch) return;

            const weightValue = parseFloat(weightMatch[1]);
            const weight = weightMatch[2].toLowerCase() === 'kg' ? weightValue * 1000 : weightValue;
            if (isNaN(weight) || weight <= 0) return;

            // Price is in span.final-price.price-ttc: "348€ inc. tax"
            const priceText = $(el).find('span.final-price').first().text();
            const priceMatch = priceText.match(/(\d+(?:[.,]\d+)?)\s*€/);
            if (!priceMatch) return;
            const price = parseFloat(priceMatch[1].replace(',', '.'));
            if (isNaN(price) || price <= 0) return;

            const name = fullName.replace(/\s+\d+(?:\.\d+)?\s*(?:kg|g)\s*$/i, '').trim();
            if (!name) return;

            meteorites.push({name, weight, price, currency: Currency.EUR});
        });

        return meteorites;
    }
}
