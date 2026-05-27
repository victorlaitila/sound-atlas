#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { SoundAtlasStack } from "../lib/sound-atlas-stack";

const app = new cdk.App();

new SoundAtlasStack(app, "SoundAtlasStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? process.env.AWS_REGION ?? "eu-north-1",
  },
});
