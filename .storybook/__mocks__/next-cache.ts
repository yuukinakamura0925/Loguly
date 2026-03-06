// Stub for next/cache in Storybook browser environment
export const revalidatePath = () => {};
export const revalidateTag = () => {};
export const unstable_cache = (fn: (...args: unknown[]) => unknown) => fn;
export const unstable_noStore = () => {};
