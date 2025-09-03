/* tslint:disable */
/* eslint-disable */
import { ImBotApi, ImWalletApi } from './apis';
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
    middleware: [
      {
        post: async (context) => {
          // check if the response has an error field,
          // if it does and the error.code is not 0, throw an error, otherwise return the response
          const response = context.response.clone() as Response;
          const data = await response.json();
          if (data.error && data.error.code !== '0') {
            throw new Error(data.error.message || data.error.code);
          } else {
            return context.response.clone() as Response;
          }
        },
      },
    ],
  });
};

export const api = new ImBotApi(createConfig());
export const botApi = new ImBotApi(createConfig());
export const walletApi = new ImWalletApi(createConfig());
