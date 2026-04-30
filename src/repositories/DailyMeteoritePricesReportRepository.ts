import { BatchWriteCommand, DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
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

    async getByName(meteoriteName: string): Promise<Array<DailyMeteoritePrice>> {
        const response = await this.client.send(new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: 'PK = :pk',
            ExpressionAttributeValues: { ':pk': `DAILY_REPORT#${meteoriteName}` },
        }));

        return (response.Items ?? []) as Array<DailyMeteoritePrice>;
    }

    async putAll(entries: Array<DailyMeteoritePrice>): Promise<void> {
        const catalogItems = [...new Set(entries.map((e) => e.meteoriteName))].map((name) => ({
            PutRequest: {
                Item: {
                    PK: 'METEORITE_CATALOG',
                    SK: `NAME#${name}`,
                    meteoriteName: name,
                },
            },
        }));

        const allItems = [
            ...entries.map((entry) => ({
                PutRequest: {
                    Item: {
                        PK: `DAILY_REPORT#${entry.meteoriteName}`,
                        SK: `DAILY_REPORT#${entry.date}`,
                        ...entry,
                    },
                },
            })),
            ...catalogItems,
        ];

        for (let i = 0; i < allItems.length; i += 25) {
            await this.client.send(new BatchWriteCommand({
                RequestItems: { [TABLE_NAME]: allItems.slice(i, i + 25) },
            }));
        }
    }

    async getAllMeteoriteNames(): Promise<Array<string>> {
        const names: string[] = [];
        let lastEvaluatedKey: Record<string, unknown> | undefined;

        do {
            const response = await this.client.send(new QueryCommand({
                TableName: TABLE_NAME,
                KeyConditionExpression: 'PK = :pk',
                ExpressionAttributeValues: { ':pk': 'METEORITE_CATALOG' },
                ProjectionExpression: 'meteoriteName',
                ExclusiveStartKey: lastEvaluatedKey,
            }));

            for (const item of response.Items ?? []) {
                names.push(item['meteoriteName'] as string);
            }

            lastEvaluatedKey = response.LastEvaluatedKey as Record<string, unknown> | undefined;
        } while (lastEvaluatedKey !== undefined);

        return names;
    }
}

