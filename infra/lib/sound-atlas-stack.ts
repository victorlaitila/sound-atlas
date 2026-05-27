import * as path from "node:path";
import * as cdk from "aws-cdk-lib";
import { Duration, RemovalPolicy, Stack, type StackProps } from "aws-cdk-lib";
import {
  CorsHttpMethod,
  HttpApi,
  HttpMethod,
} from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import {
  AttributeType,
  BillingMode,
  Table,
} from "aws-cdk-lib/aws-dynamodb";
import {
  Architecture,
  Runtime,
  Tracing,
} from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import type { Construct } from "constructs";

export class SoundAtlasStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const cacheTable = new Table(this, "SoundtrackCache", {
      tableName: "SoundtrackCache",
      partitionKey: {
        name: "countryCode",
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: "ttl",
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const soundtrackLookup = new NodejsFunction(this, "SoundtrackLookup", {
      functionName: "soundtrackLookup",
      entry: path.join(__dirname, "../lambda/soundtrackLookup.ts"),
      handler: "handler",
      runtime: Runtime.NODEJS_20_X,
      architecture: Architecture.ARM_64,
      memorySize: 256,
      timeout: Duration.seconds(10),
      logGroup: new LogGroup(this, "SoundtrackLookupLogGroup", {
        logGroupName: "/aws/lambda/soundtrackLookup",
        retention: RetentionDays.ONE_WEEK,
        removalPolicy: RemovalPolicy.DESTROY,
      }),
      tracing: Tracing.ACTIVE,
      environment: {
        CACHE_TABLE_NAME: cacheTable.tableName,
        CACHE_TTL_SECONDS: String(7 * 24 * 60 * 60),
      },
      bundling: {
        minify: true,
        sourceMap: true,
        target: "node20",
        tsconfig: path.join(__dirname, "../tsconfig.lambda.json"),
        externalModules: ["@aws-sdk/*"],
      },
    });

    cacheTable.grantReadWriteData(soundtrackLookup);

    const api = new HttpApi(this, "SoundAtlasHttpApi", {
      apiName: "sound-atlas-api",
      corsPreflight: {
        allowHeaders: ["content-type"],
        allowMethods: [CorsHttpMethod.GET, CorsHttpMethod.POST, CorsHttpMethod.OPTIONS],
        allowOrigins: ["*"],
      },
    });

    api.addRoutes({
      path: "/soundtrack",
      methods: [HttpMethod.GET, HttpMethod.POST],
      integration: new HttpLambdaIntegration(
        "SoundtrackLookupIntegration",
        soundtrackLookup,
      ),
    });

    new cdk.CfnOutput(this, "SoundtrackApiUrl", {
      value: api.apiEndpoint,
      description: "HTTP API base URL. Use /soundtrack?countryCode=FI for lookup.",
    });

    new cdk.CfnOutput(this, "SoundtrackCacheTableName", {
      value: cacheTable.tableName,
    });
  }
}
