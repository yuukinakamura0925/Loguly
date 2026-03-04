// Stub for Node.js built-in modules (crypto etc.) in Storybook browser environment
export const randomBytes = (size: number) => new Uint8Array(size);
export const createHash = () => ({ update: () => ({ digest: () => '' }) });
export default {};
