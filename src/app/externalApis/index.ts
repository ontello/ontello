/* tslint:disable */
/* eslint-disable */
import { DefaultApi } from './apis/DefaultApi';
import { Configuration } from './runtime';

export * from './runtime';
export * from './apis/index';
export * from './models/index';

const BASE_URL = 'https://chatbotapitest.ont.network';

const createConfig = () => {
  const token = localStorage.getItem('cinny_access_token') || undefined;
  return new Configuration({
    basePath: `${BASE_URL}`,
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });
};

export const api = new DefaultApi(createConfig());
