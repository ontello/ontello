/* tslint:disable */
/* eslint-disable */
import { DefaultApi } from './apis/DefaultApi';
import { Configuration } from './runtime';

export * from './runtime';
export * from './apis/index';
export * from './models/index';

export const api = new DefaultApi(
  new Configuration({
    // TODO
    basePath: 'https://chatbotapitest.ont.network/business',
  })
);
