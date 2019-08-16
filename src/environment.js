const isBrowser = typeof window !== 'undefined';
const isNode = !isBrowser;

export {isBrowser, isNode};
