import { setTimeout } from "node:timers";

export class MyPromise<T> {
  #PromiseState: "pending" | "fulfilled" | "rejected" = "pending";
  #PromiseResult: T | undefined = undefined;
  #PromiseFullfillReactions: ((value: T) => void)[] = [];
  #PromiseRejectReactions: ((reason: any) => never)[] = [];

  constructor(
    executor: (
      resolve: (value: T) => void,
      reject: (reason: any) => void,
    ) => void,
  ) {
    const _resolve = (value: T) => {
      queueMicrotask(() => {
        if (this.#PromiseState !== "pending") return;

        if (value instanceof MyPromise) {
          value.then(_resolve, _reject);
          return;
        }
        this.#PromiseResult = value;
        this.#PromiseState = "fulfilled";
        this.#runCallbacks();
      });
    };
    const _reject = (reason: any) => {
      queueMicrotask(() => {
        if (this.#PromiseState !== "pending") return;

        if (reason instanceof MyPromise) {
          reason.then(_resolve, _reject);
          return;
        }
        this.#PromiseResult = reason;
        this.#PromiseState = "rejected";
        this.#runCallbacks();
      });
    };

    try {
      executor(_resolve, _reject);
    } catch (error) {
      _reject(error);
    }
  }

  #runCallbacks() {
    if (this.#PromiseState === "fulfilled") {
      this.#PromiseFullfillReactions.forEach((reaction) =>
        reaction(this.#PromiseResult),
      );
    }

    if (this.#PromiseState === "rejected") {
      this.#PromiseRejectReactions.forEach((reaction) =>
        reaction(this.#PromiseResult),
      );
    }
  }

  // Static methods
  // DON'T confuse with the functions being passed into the constructor!
  static resolve<T>(value: T): void {}
  static reject: () => {};

  // Instance methods
  then(
    onFullfilled?: ((value: T) => T) | null | undefined,
    onRejected?: (reason: any) => never,
  ): MyPromise<T> {
    return new MyPromise<T>((resolve, reject) => {
      this.#PromiseFullfillReactions.push((result) => {
        if (!onFullfilled) {
          resolve(result);
          return;
        }

        try {
          resolve(onFullfilled(result));
        } catch (error) {
          reject(error);
        }
      });

      this.#PromiseRejectReactions.push((reason) => {
        if (!onRejected) {
          reject(reason);
          return;
        }

        try {
          reject(onRejected(reason));
        } catch (error) {
          reject(reason);
        }
      });
    });
  }

  catch(onRejected?: (reason: any) => never): MyPromise<T> {
    return this.then(undefined, onRejected);
  }

  finally(onFinally: () => void): MyPromise<T> {
    return this.then(onFinally, onFinally);
  }
}
