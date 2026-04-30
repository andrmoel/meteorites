import * as cdk from 'aws-cdk-lib/core';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as eventsTargets from 'aws-cdk-lib/aws-events-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { Construct } from 'constructs';
import * as path from 'path';

export class MeteoritePricesStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const table = new dynamodb.TableV2(this, 'MeteoritePricesTable', {
            tableName: 'MeteoritePrices',
            partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
            billing: dynamodb.Billing.onDemand(),
            removalPolicy: cdk.RemovalPolicy.RETAIN,
        });

        const scanLambda = new nodejs.NodejsFunction(this, 'ScanMeteoriteWebsites', {
            entry: path.join(__dirname, '../src/lambda/scanMeteoriteWebsites.ts'),
            handler: 'handler',
            runtime: lambda.Runtime.NODEJS_24_X,
            memorySize: 1024,
            timeout: cdk.Duration.minutes(5),
        });

        table.grantWriteData(scanLambda);

        new events.Rule(this, 'ScanMeteoriteWebsitesCron', {
            schedule: events.Schedule.cron({ minute: '0', hour: '0' }),
            targets: [new eventsTargets.LambdaFunction(scanLambda)],
        });

        const getMeteoritePriceLambda = new nodejs.NodejsFunction(this, 'GetMeteoritePrice', {
            entry: path.join(__dirname, '../src/lambda/getMeteoritePrice.ts'),
            handler: 'handler',
            runtime: lambda.Runtime.NODEJS_24_X,
            timeout: cdk.Duration.seconds(10),
        });

        table.grantReadData(getMeteoritePriceLambda);

        const api = new apigwv2.HttpApi(this, 'MeteoritePricesApi');

        api.addRoutes({
            path: '/meteorites/{name}',
            methods: [apigwv2.HttpMethod.GET],
            integration: new HttpLambdaIntegration('GetMeteoritePriceIntegration', getMeteoritePriceLambda),
        });

        new cdk.CfnOutput(this, 'ApiUrl', { value: api.url! });
    }
}
