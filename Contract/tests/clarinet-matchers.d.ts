// Type augmentation for Clarinet custom Vitest matchers so TypeScript stops complaining.
// Minimal signatures; all parameters optional because matcher implementations are flexible.
import 'vitest';

declare module 'vitest' {
  interface Assertion<T = any> {
    toBeOk(expected?: any): T;
    toBeErr(expected?: any): T;
    toBeUint(value: number): T;
    toBeBool(value: boolean): T;
    toBeSome(expected?: any): T;
    toBeNone(): T;
  }
  interface AsymmetricMatchers {
    toBeOk(expected?: any): void;
    toBeErr(expected?: any): void;
    toBeSome(expected?: any): void;
    toBeNone(): void;
  }
}

export {};