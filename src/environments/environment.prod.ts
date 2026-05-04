/**
 * Configuración de entorno PRODUCTION
 */

export const environment = {
  production: true,
  environment: 'prod',
  transactionsApiBaseUrl: '/channel/v1',
  accountsApiBaseUrl: '/channel/v1',
  deviceIpLookupUrl: 'https://api.ipify.org?format=json',
  defaultDeviceIp: "127.0.0.1"
};
