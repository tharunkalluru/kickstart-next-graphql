import { CodegenConfig } from '@graphql-codegen/cli';
import * as dotenv from 'dotenv';

dotenv.config();
const apiKey = process.env.NEXT_PUBLIC_CONTENTSTACK_API_KEY;
const environment = process.env.NEXT_PUBLIC_CONTENTSTACK_ENVIRONMENT;
const region = process.env.NEXT_PUBLIC_CONTENTSTACK_REGION
const baseURL = region === 'NA' ? 'graphql.contentstack.com' : 'eu-graphql.contentstack.com'
const accessToken = process.env.NEXT_PUBLIC_CONTENTSTACK_DELIVERY_TOKEN

const config: CodegenConfig = {
  schema: apiKey && accessToken ? {
    [`https://${baseURL}/stacks/${apiKey}?environment=${environment}`]: {
      headers: {
        access_token: accessToken,
      },
    },
  } : undefined,
  documents: ['./**/*.tsx', './**/*.ts', '!src/gql/**/*'],
  generates: {
    './gql/': {
      preset: 'client',
      plugins: [],
    },
  },
};

export default config;