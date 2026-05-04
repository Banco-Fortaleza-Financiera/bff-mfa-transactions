const { share, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');
const path = require('path');
const webpack = require('webpack');

const moduleFederationConfig = withModuleFederationPlugin({
  name: 'bffMfaTransactions',
  filename: 'remoteEntry.js',
  exposes: {
    './TransactionsModule': './src/app/transactions/transactions.module.ts',
    './TransactionsListComponent': './src/app/transactions/transactions-list/transactions-list.component.ts'
  },
  shared: share({
    '@angular/core': { singleton: true, strictVersion: false, requiredVersion: 'auto' },
    '@angular/common': { singleton: true, strictVersion: false, requiredVersion: 'auto' },
    '@angular/compiler': { singleton: true, strictVersion: false, requiredVersion: 'auto' },
    '@angular/router': { singleton: true, strictVersion: false, requiredVersion: 'auto' },
    '@angular/forms': { singleton: true, strictVersion: false, requiredVersion: 'auto' },
    'rxjs': { singleton: true, strictVersion: false, requiredVersion: 'auto' }
  })
});

const environmentFiles = {
  local: 'environment.local.ts',
  dev: 'environment.dev.ts',
  test: 'environment.test.ts',
  production: 'environment.prod.ts',
  prod: 'environment.prod.ts'
};

module.exports = (env = {}) => {
  const configuration = env.configuration || 'local';
  const environmentFile = environmentFiles[configuration] || environmentFiles.local;
  const environmentPath = path.resolve(__dirname, 'src/environments', environmentFile);

  return {
    ...moduleFederationConfig,
    entry: {
      main: './src/remote-bootstrap.ts'
    },
    output: {
      ...(moduleFederationConfig.output || {}),
      path: path.resolve(__dirname, 'dist/bff-mfa-transactions/browser'),
      publicPath: 'auto'
    },
    resolve: {
      ...moduleFederationConfig.resolve,
      extensions: ['.ts', '.js', '.mjs']
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                configFile: 'tsconfig.app.json',
                transpileOnly: true
              }
            },
            {
              loader: path.resolve(__dirname, 'loaders/angular-resource-inline-loader.js')
            }
          ],
          exclude: /node_modules/
        }
      ]
    },
    plugins: [
      ...(moduleFederationConfig.plugins || []),
      new webpack.NormalModuleReplacementPlugin(
        /environments\/environment$/,
        environmentPath
      )
    ],
    devServer: {
      host: '0.0.0.0',
      static: {
        directory: path.join(__dirname, 'public')
      },
      port: 4203,
      allowedHosts: 'all',
      historyApiFallback: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0'
      }
    }
  };
};
