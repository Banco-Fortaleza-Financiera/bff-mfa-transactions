/**
 * Configuración de entorno LOCAL
 */

export const environment = {
  production: false,
  environment: 'local',
  transactionsApiBaseUrl: 'http://localhost:8083/channel/v1',
  accountsApiBaseUrl: 'http://localhost:8082/channel/v1',
  deviceIpLookupUrl: 'https://api.ipify.org?format=json',
  defaultDeviceIp: "127.0.0.1"
};
