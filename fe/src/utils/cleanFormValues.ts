/**
 * Removes keys from an object where the value is null, undefined, or empty string.
 */
export function cleanFormValues<T extends Record<string, any>>(obj: T): Partial<T> {
    return Object.fromEntries(
        Object.entries(obj).filter(([_, v]) => v !== null && v !== undefined && v !== "")
    ) as Partial<T>;
}
 