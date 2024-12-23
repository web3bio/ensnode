export const uniq = <T>(arr: T[]): T[] => [...new Set(arr)];

export const hasNullByte = (value: string) => value.indexOf("\u0000") !== -1;
