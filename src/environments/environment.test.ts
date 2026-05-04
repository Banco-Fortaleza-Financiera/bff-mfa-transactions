/**
 * Configuración de entorno TEST
 */

export const environment = {
  production: false,
  environment: 'test',
  transactionsApiBaseUrl: '/channel/v1',
  accountsApiBaseUrl: '/channel/v1',
  deviceIpLookupUrl: 'https://api.ipify.org?format=json',
  defaultDeviceIp: "127.0.0.1"
};
