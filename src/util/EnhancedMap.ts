export type ValueAndKeyFunction<K = unknown, V = unknown, R = unknown> = (
    value: V,
    key?: K,
    map?: EnhancedMap<K, V>,
) => R;

// deno-lint-ignore no-explicit-any
export class EnhancedMap<K = any, V = any> extends Map<K, V> {
    map<TK = unknown, TV = unknown>(
        func: ValueAndKeyFunction<K, V, [TK, TV]>,
    ): EnhancedMap<TK, TV> {
        const newSet = new EnhancedMap<TK, TV>();

        for (const [key, value] of this) {
            const [newKey, newValue] = func(value, key, this);

            newSet.set(newKey, newValue);
        }

        return newSet;
    }

    filter(func: ValueAndKeyFunction<K, V, boolean>): EnhancedMap<K, V> {
        const newSet = new EnhancedMap<K, V>();

        for (const [key, value] of this) {
            if (func(value, key, this)) {
                newSet.set(key, value);
            }
        }

        return newSet;
    }

    every(func: ValueAndKeyFunction<K, V, boolean>): boolean {
        for (const [key, value] of this) {
            if (!func(value, key, this)) {
                return false;
            }
        }

        return true;
    }

    some(func: ValueAndKeyFunction<K, V, boolean>): boolean {
        for (const [key, value] of this) {
            if (func(value, key, this)) {
                return true;
            }
        }

        return false;
    }

    toArray(): [K, V][] {
        return Array.from(this);
    }

    clone(): EnhancedMap<K, V> {
        return new EnhancedMap(this.toArray());
    }
}

export default EnhancedMap;
