import {MeteoritePrice} from "../types/MeteoritePriceTypes";
import axios from "axios";
import Parser from "./Parser";

const API_BASE = 'https://aerolite.org/wp-json/wc/store/v1/products';
const PER_PAGE = 100;

type WcProduct = {
    name: string;
    prices: {
        price: string;
        currency_code: string;
        currency_minor_unit: number;
    };
};

export default class AeroliteMeteoritesParser implements Parser {
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
        // Weight is embedded in the name, e.g. "Bechar 003 Meteorite 1.50g End-Cut" or "Campo del Cielo Meteorite 9.2kg"
        // Products without a weight pattern (books, equipment, etc.) are skipped.
        const weightMatch = product.name.match(/(\d+(?:\.\d+)?)\s*(kg|g)\b/i);
        if (!weightMatch) return null;

        const weightValue = parseFloat(weightMatch[1]);
        const weight = weightMatch[2].toLowerCase() === 'kg' ? weightValue * 1000 : weightValue;
        if (isNaN(weight) || weight <= 0) return null;

        // Price is stored in minor currency units (cents for USD)
        const price = parseInt(product.prices.price, 10) / Math.pow(10, product.prices.currency_minor_unit);
        if (isNaN(price) || price <= 0) return null;

        const currency = product.prices.currency_code === 'USD' ? 'USD' : 'EUR';

        // Strip the weight and everything after it from the name
        const weightIndex = product.name.search(/\s*\d+(?:\.\d+)?\s*(?:kg|g)\b/i);
        const name = product.name.slice(0, weightIndex).trim();
        if (!name) return null;

        return {name, weight, price, currency};
    }
}
