import {Currency} from "../../currency/enums/Currency";

export type MeteoritePrice = {
    name: string, // Meteorite name
    weight: number, // Weight in gramm
    price: number, // Price in Euro
    currency: Currency,
    pricePerGramm?: number, // Price in Euro per gramm
}

export type DailyMeteoritePrice = {
    meteoriteName: string;
    date: string;
    averagePricePerGrammInUsd: number;
    medianPricePerGrammInUsd: number;
    pricePerGrammHigh: number;
    pricePerGrammLow: number;
    numberOfSamples: number;
}
