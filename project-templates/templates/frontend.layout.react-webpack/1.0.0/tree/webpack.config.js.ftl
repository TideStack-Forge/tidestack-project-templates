const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const packageJson = require('./package.json')
const port = process.env.port || process.env.npm_config_port || 8081

module.exports = (env, argv = {}) => {
  const isProduction = argv.mode === 'production'

  return {
    mode: isProduction ? 'production' : 'development',
    entry: {
      topbar: path.resolve(__dirname, 'src/topbar-entry.jsx'),
      sidebar: path.resolve(__dirname, 'src/sidebar-entry.jsx'),
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'static/js/[name].js',
      chunkFilename: 'static/js/[name].js',
      assetModuleFilename: 'static/[name][ext][query]',
      publicPath: 'auto',
      clean: true,
      library: `<#noparse>${packageJson.name}</#noparse>-[name]`,
      libraryTarget: 'umd',
      globalObject: 'self',
    },
    devtool: isProduction ? false : 'eval-cheap-module-source-map',
    resolve: {
      extensions: ['.js', '.jsx', '.json'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
          },
        },
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
          ],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'public/index.html'),
      }),
      new MiniCssExtractPlugin({
        filename: 'static/css/[name].css',
        chunkFilename: 'static/css/[name].css',
      }),
    ],
    externals: {
      react: 'React',
      'react-dom': 'ReactDOM',
      'react-dom/client': 'ReactDOM',
      'ouroboros-sdk': 'OuroborosSDK',
    },
    optimization: {
      splitChunks: false,
      runtimeChunk: false,
    },
    devServer: {
      port,
      open: false,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      static: {
        directory: path.resolve(__dirname, 'dist'),
      publicPath: 'auto',
        watch: false,
      },
      devMiddleware: {
      publicPath: 'auto',
      },
    },
    performance: {
      hints: false,
    },
    stats: 'minimal',
  }
}
