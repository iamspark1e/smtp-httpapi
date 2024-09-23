export function removeNestedNullUndefined(obj: { [x: string]: any; }) {
    for (const key in obj) {
        if (obj[key] === null || obj[key] === undefined) {
            delete obj[key];
        } else if (typeof obj[key] === 'object') {
            removeNestedNullUndefined(obj[key]);
        }
    }
    return obj;
}