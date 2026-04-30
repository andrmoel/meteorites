import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import getDailyMeteoritePricesReportRepository from '../repositories/getDailyMeteoritePricesReportRepository';

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
    const name = event.pathParameters?.name;

    if (!name) {
        return { statusCode: 400, body: JSON.stringify({ message: 'Missing meteorite name' }) };
    }

    const entries = await getDailyMeteoritePricesReportRepository().getByName(decodeURIComponent(name));

    const body = entries.map(({ date, averagePricePerGrammInUsd, pricePerGrammHigh, pricePerGrammLow }) => ({
        date,
        averagePricePerGrammInUsd,
        pricePerGrammHigh,
        pricePerGrammLow,
    }));

    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    };
}
