import round from 'lodash/round';

export function calculatePricePerGramm(price: number, weight: number): number {
    return round(price / weight, 2);
}
