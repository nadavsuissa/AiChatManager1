module.exports = {
  webpack: {
    configure: {
      module: {
        rules: [
          {
            test: /\.js$/,
            enforce: 'pre',
            use: ['source-map-loader'],
            exclude: /node_modules\/(stylis|stylis-plugin-rtl)/,
          },
        ],
      },
      ignoreWarnings: [/Failed to parse source map/],
    },
  },
}; 