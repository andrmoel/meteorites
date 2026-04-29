export type MeteoritePrice = {
    name: string, // Meteorite name
    weight: number, // Weight in gramm
    price: number, // Price in Euro
    currency: 'EUR' | 'USD',
    pricePerGramm?: number, // Price in Euro per gramm
}
