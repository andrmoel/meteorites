#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import {MeteoritePricesStack} from '../lib/MeteoritePricesStack';

const app = new cdk.App();

new MeteoritePricesStack(app, 'MeteoritePrices');
