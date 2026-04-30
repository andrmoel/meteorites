import {MeteoritePrice} from "../types/MeteoritePriceTypes";
import axios from "axios";
import Parser from "./Parser";
import {Currency} from "../../currency/enums/Currency";
import * as cheerio from "cheerio";

const API_BASE = 'https://www.polandmet.com/wp-json/wc/store/v1/products';
const PER_PAGE = 100;

type WcProduct = {
    name: string;
    prices: {
        price: string;
        currency_code: string;
        currency_minor_unit: number;
    };
};

export default class PolandmetParser implements Parser {
    async getMeteoritePrices(): Promise<Array<MeteoritePrice>> {
        const firstResponse = await axios.get<WcProduct[]>(API_BASE, {
            params: {per_page: PER_PAGE, page: 1},
        });

        const totalPages = parseInt(firstResponse.headers['x-wp-totalpages'] ?? '1', 10);
        const results: Array<MeteoritePrice> = this.parseProducts(firstResponse.data);

        if (totalPages > 1) {
            const remainingPages = Array.from({length: totalPages - 1}, (_, i) => i + 2);
            const responses = await Promise.all(
                remainingPages.map((page) => axios.get<WcProduct[]>(API_BASE, {params: {per_page: PER_PAGE, page}}))
            );
            for (const response of responses) {
                results.push(...this.parseProducts(response.data));
            }
        }

        return results;
    }

    private parseProducts(products: WcProduct[]): Array<MeteoritePrice> {
        return products.flatMap((p) => {
            const parsed = this.parseProduct(p);
            return parsed ? [parsed] : [];
        });
    }

    private parseProduct(product: WcProduct): MeteoritePrice | null {
        // Name contains HTML entities, e.g. "D&#8217;ORBIGNY (33.91 gram)"
        const rawName = cheerio.load(`<span>${product.name}</span>`)('span').text();

        // Weight is in parentheses at end of name: "(33.91 gram)" or "(0.5 grams)"
        const weightMatch = rawName.match(/\((\d+(?:\.\d+)?)\s*grams?\)$/i);
        if (!weightMatch) return null;

        const weight = parseFloat(weightMatch[1]);
        if (isNaN(weight) || weight <= 0) return null;

        // Price is in major currency units (currency_minor_unit is 0)
        const price = parseInt(product.prices.price, 10) / Math.pow(10, product.prices.currency_minor_unit);
        if (isNaN(price) || price <= 0) return null;

        const currency = product.prices.currency_code === 'USD' ? Currency.USD : Currency.EUR;

        const name = rawName.replace(/\s*\(\d+(?:\.\d+)?\s*grams?\)$/i, '').trim();
        if (!name) return null;

        return {name, weight, price, currency};
    }
}
