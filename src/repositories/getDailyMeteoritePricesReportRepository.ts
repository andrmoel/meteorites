import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { DailyMeteoritePricesReportRepository } from './DailyMeteoritePricesReportRepository';

let instance: DailyMeteoritePricesReportRepository | null = null;

export default function getDailyMeteoritePricesReportRepository(): DailyMeteoritePricesReportRepository {
    if (!instance) {
        const dynamo = new DynamoDBClient();
        instance = new DailyMeteoritePricesReportRepository(DynamoDBDocumentClient.from(dynamo));
    }
    return instance;
}
