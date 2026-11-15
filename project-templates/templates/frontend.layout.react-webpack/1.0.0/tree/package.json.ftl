{
  "name": ${esc.json(packageName)},
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "start": "webpack serve --config webpack.config.js --mode development",
    "dev": "webpack serve --config webpack.config.js --mode development",
    "build": "webpack --config webpack.config.js --mode production",
    "test:contract": "node --test tests/layout-parcels-contract.test.cjs"
  },
  "dependencies": {
    "ouroboros-sdk": "^1.6.0-beta.6",
    "qiankun": "^2.10.16",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@babel/core": "^7.29.7",
    "@babel/preset-env": "^7.29.7",
    "@babel/preset-react": "^7.29.7",
    "babel-loader": "^9.2.1",
    "css-loader": "^7.1.2",
    "html-webpack-plugin": "^5.6.7",
    "mini-css-extract-plugin": "^2.9.4",
    "style-loader": "^4.0.0",
    "webpack": "^5.108.4",
    "webpack-cli": "^7.2.1",
    "webpack-dev-server": "^6.0.0"
  }
}
