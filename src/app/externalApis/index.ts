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
        pre: async (context) => {
          // Get the latest token from localStorage
          const latestToken = localStorage.getItem('cinny_access_token');
          if (latestToken) {
            context.init.headers = {
              ...context.init.headers,
              Authorization: `Bearer ${latestToken}`,
            };
          }
          return context;
        },
        post: async (context) => {
          // If the response is not 200, throw an error
          if (context.response.status !== 200) {
            const error = new Error(`Status: ${context.response.status.toString()}`);
            (error as any).info = {
              status: context.response.status,
            };
            throw error;
          }

          // check if the response has an error field,
          // if it does and the error.code is not 0, throw an error, otherwise return the response
          const response = context.response.clone() as Response;
          const data = await response.json();
          if (data.error && data.error.code !== '0') {
            const error = new Error(data.error.message || data.error.code);
            (error as any).info = {
              code: data.error.code,
              message: data.error.message,
            };
            throw error;
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
