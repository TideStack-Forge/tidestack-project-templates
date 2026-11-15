const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const packageJson = require('./package.json')

module.exports = {
  entry: {
    app: path.resolve(__dirname, 'src/main.jsx'),
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'static/js/[name].js',
      publicPath: 'auto',
    clean: true,
    library: `<#noparse>${packageJson.name}</#noparse>-[name]`,
    libraryTarget: 'umd',
    globalObject: 'self',
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: { loader: 'babel-loader' },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'public/index.html'),
    }),
  ],
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
    'react-dom/client': 'ReactDOMClient',
    'ouroboros-sdk': 'OuroborosSDK',
    qiankun: 'qiankun',
  },
  optimization: {
    splitChunks: false,
    runtimeChunk: false,
  },
  stats: 'minimal',
}
