import { Fn } from "../server/types.ts";

export class EnhancedSet<T> extends Set<T> {
    map(func: Fn<[T], T>): EnhancedSet<unknown> {
        const newSet = new EnhancedSet();

        for (const value of this) {
            newSet.add(func(value));
        }

        return newSet;
    }

    reduce(func: Fn<[T, T], T>, initial: T): T {
        let result = initial;

        for (const value of this) {
            result = func(result, value);
        }

        return result;
    }

    filter(func: Fn<[T], boolean>): EnhancedSet<T> {
        const newSet = new EnhancedSet<T>();

        for (const value of this) {
            if (func(value)) {
                newSet.add(value);
            }
        }

        return newSet;
    }

    every(func: Fn<[T], boolean>): boolean {
        for (const value of this) {
            if (!func(value)) {
                return false;
            }
        }

        return true;
    }

    some(func: Fn<[T], boolean>): boolean {
        for (const value of this) {
            if (func(value)) {
                return true;
            }
        }

        return false;
    }

    toArray(): T[] {
        return Array.from(this);
    }

    clone(): EnhancedSet<T> {
        return new EnhancedSet(this.toArray());
    }
}

export default EnhancedSet;
