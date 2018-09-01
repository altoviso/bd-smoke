let isBrowser = typeof window !== "undefined";
let isNode = !isBrowser;

export {isBrowser, isNode};
