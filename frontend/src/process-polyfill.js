// Manual lightweight polyfill for process
export const process = {
  env: {
    NODE_ENV: 'development',
  },
  nextTick: (cb) => setTimeout(cb, 0),
  browser: true,
  version: '',
  argv: [],
};

export default process;
