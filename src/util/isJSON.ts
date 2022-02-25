export function isJSON(str: unknown) {
    if (typeof str !== "string") return false;

    try {
        const result = JSON.parse(str);

        const type = Object.prototype.toString.call(result);

        return type === "[object Object]" ||
            type === "[object Array]";
    } catch {
        return false;
    }
}

export default isJSON;
