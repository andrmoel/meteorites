import axios from "axios";
import {Currency} from "./enums/Currency";

const API_BASE = 'https://v6.exchangerate-api.com/v6/45c7f47d820c8039150fbd1d/latest';

let cache: Map<string, number> | null = null;

export default async function getExchangeRates(): Promise<Map<string, number>> {
    if (cache) return cache;

    const currencies = Object.values(Currency);
    const responses = await Promise.all(
        currencies.map(currency =>
            axios.get<{conversion_rates: Record<string, number>}>(`${API_BASE}/${currency}`)
        )
    );

    cache = new Map(
        currencies.map((currency, i) => [currency, responses[i].data.conversion_rates['USD']])
    );

    return cache;
}
