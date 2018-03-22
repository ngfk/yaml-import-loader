/**
 * Requests data from the specified uri returning the content as a string.
 * @param uri The uri to request data from.
 */
export const request = async (uri: string): Promise<string> => {
    const { get: getHttp } = await import('http');
    const { get: getHttps } = await import('https');
    const get = uri.startsWith('https://') ? getHttps : getHttp;

    return new Promise<string>((resolve, reject) => {
        let result = '';
        get(uri, res => {
            res.on('data', data => (result += data));
            res.on('end', () => resolve(result));
            res.on('error', err => reject(err));
        });
    });
};

/**
 * Reads data from a file returning the content as a string.
 * @param path The path to read data from.
 */
export const readFile = async (path: string): Promise<string> => {
    const { readFile: nodeReadFile } = await import('fs');
    return new Promise<string>((resolve, reject) => {
        nodeReadFile(path, (err, data) => {
            if (err) reject(err);
            else resolve(data.toString());
        });
    });
};

/**
 * Finds nested promises within the provided value/object and returns one
 * promise that resolves when all nested promises are resolved.
 * @param value The value to promisify.
 */
export const resolveNestedPromises = async <T>(value: T): Promise<T> => {
    if (value instanceof Promise) return value;

    if (value instanceof Array) {
        const elements = value.map(entry => resolveNestedPromises(entry));
        return Promise.all(elements) as any;
    }

    if (typeof value === 'object' && value !== null) {
        let result: any = {};
        for (const key of Object.keys(value)) {
            const property = await resolveNestedPromises((value as any)[key]);
            result[key] = property;
        }
        return result;
    }

    return value;
};
