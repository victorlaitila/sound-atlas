# SoundAtlas AWS Infra

This CDK app deploys the first serverless backend for SoundAtlas:

```text
Frontend
  -> API Gateway HTTP API
  -> Lambda: soundtrackLookup
  -> DynamoDB: SoundtrackCache
  -> iTunes Search API
```

The frontend can call this API when `NEXT_PUBLIC_SOUNDATLAS_API_URL` is set in
the root `.env.local` file. Without that value, the Next.js app uses the local
route at `/api/audio?countryCode=FI`.

## Resources

- `SoundAtlasHttpApi`: HTTP API with `GET /soundtrack` and `POST /soundtrack`
- `soundtrackLookup`: Node.js 20 Lambda that reuses the shared soundtrack lookup logic from `src/server/audio`
- `SoundtrackCache`: on-demand DynamoDB table keyed by `countryCode`

## Cache Behavior

The Lambda checks DynamoDB before calling iTunes. A cache item stores:

- `countryCode`
- normalized soundtrack JSON
- title and creator
- artwork URL
- preview URL
- `cachedAt`
- `ttl`

Items are considered fresh for 7 days. DynamoDB TTL is enabled on the `ttl`
attribute, and the Lambda also checks freshness before returning a cached item.

## Setup

From the repository root, install the app dependencies first:

```bash
npm install
```

Then install CDK dependencies:

```bash
cd infra
npm install
```

Configure AWS credentials with the AWS CLI. For example:

```bash
aws configure sso
export AWS_PROFILE=your-profile
export AWS_REGION=eu-north-1
```

Bootstrap CDK once per account/region:

```bash
npx cdk bootstrap
```

## Deploy

```bash
cd infra
npm run build
npm run synth
npm run deploy
```

After deploy, CDK prints `SoundtrackApiUrl`.

Test the backend directly:

```bash
curl "$SoundtrackApiUrl/soundtrack?countryCode=FI"
```

To connect the frontend to the deployed API, set the base URL in the root
`.env.local` file:

```bash
NEXT_PUBLIC_SOUNDATLAS_API_URL=$SoundtrackApiUrl
```

## Free-Tier Notes

This stack is intentionally small and portfolio-friendly:

- HTTP API is cheaper than REST API for this simple request/response workload.
- Lambda uses 256 MB memory and a 10-second timeout.
- DynamoDB uses on-demand billing, so idle development projects do not need
  provisioned capacity.
- Log retention is set to one week to avoid long-running CloudWatch storage.

Costs can still occur after free-tier usage or high request volume. Destroy the
stack when you no longer need it:

```bash
cd infra
npm run destroy
```
