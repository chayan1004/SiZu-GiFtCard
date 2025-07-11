// Set environment variable to suppress browser data warnings
process.env.BROWSERSLIST_IGNORE_OLD_DATA = 'true';

export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {
      overrideBrowserslist: [
        '> 0.5%',
        'last 2 versions', 
        'not dead',
        'Chrome >= 85',
        'Firefox >= 85',
        'Safari >= 14',
        'Edge >= 85'
      ]
    },
  },
}
