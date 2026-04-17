// Polyfill for process.env
if (typeof window !== 'undefined') {
  (window as any).process = {
    env: {
      NODE_ENV: import.meta.env.MODE || 'development',
    },
    nextTick: (callback: any) => setTimeout(callback, 0),
    browser: true,
  };
  (window as any).global = window;
}

export {};
