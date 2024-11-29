// webpack.config.js
const webpack = require('webpack');
const path = require('path');

module.exports = {
  entry: {
    content: './src/content.js',
    popup: './src/popup.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js'
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.VISION_API_KEY': JSON.stringify(process.env.VISION_API_KEY)
    })
  ]
};