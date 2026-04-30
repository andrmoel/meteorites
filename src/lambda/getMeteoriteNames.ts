import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import getDailyMeteoritePricesReportRepository from '../repositories/getDailyMeteoritePricesReportRepository';

export async function handler(_event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
    const names = await getDailyMeteoritePricesReportRepository().getAllMeteoriteNames();

    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(names),
    };
}
