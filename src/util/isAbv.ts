const ArrayBufferView =
    Object.getPrototypeOf(Object.getPrototypeOf(new Uint8Array())).constructor;

export function isAbv(value: unknown) {
    return value instanceof ArrayBufferView;
}
