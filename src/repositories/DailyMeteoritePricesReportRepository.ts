import { BatchWriteCommand, DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { DailyMeteoritePrice } from '../services/meteoriteWebsiteParser/types/MeteoritePriceTypes';

const TABLE_NAME = 'MeteoritePrices';

export class DailyMeteoritePricesReportRepository {
    private readonly client: DynamoDBDocumentClient;

    constructor(client: DynamoDBDocumentClient) {
        this.client = client;
    }

    async put(entry: DailyMeteoritePrice): Promise<void> {
        await this.client.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                PK: `DAILY_REPORT#${entry.meteoriteName}`,
                SK: `DAILY_REPORT#${entry.date}`,
                ...entry,
            },
        }));
    }

    async putAll(entries: Array<DailyMeteoritePrice>): Promise<void> {
        for (let i = 0; i < entries.length; i += 25) {
            const batch = entries.slice(i, i + 25);
            await this.client.send(new BatchWriteCommand({
                RequestItems: {
                    [TABLE_NAME]: batch.map((entry) => ({
                        PutRequest: {
                            Item: {
                                PK: `DAILY_REPORT#${entry.meteoriteName}`,
                                SK: `DAILY_REPORT#${entry.date}`,
                                ...entry,
                            },
                        },
                    })),
                },
            }));
        }
    }
}

