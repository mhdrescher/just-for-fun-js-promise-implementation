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
    const _resolve = (value: T) =>
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
    const _reject = (reason: any) =>
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
  static resolve<T>(value: T | MyPromise<T>): MyPromise<T> {
    if (value instanceof MyPromise) return value;

    return new MyPromise<T>((resolve) => {
      resolve(value);
    });
  }

  // MDN states: Unlike Promise.resolve(), Promise.reject() always wraps reason in a new Promise object, even when reason is already a Promise.
  // see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/reject#description
  static reject<T>(value: T): MyPromise<T> {
    return new MyPromise<T>((_resolve, reject) => {
      reject(value);
    });
  }

  static all<T>(promises: Array<T | MyPromise<T>>): MyPromise<Awaited<T>[]> {
    const resolvedValueMap: Awaited<T>[] = [];
    // To be able to push resolved promises to a specific index of the array,
    // one needs another place to track how many promises were resolved
    let promisesResolved = 0;
    return new MyPromise<Awaited<T>[]>((res, rej) => {
      promises.map((p, i) =>
        MyPromise.resolve(p)
          .then((v) => {
            resolvedValueMap[i] = v;
            promisesResolved++;
            if (promisesResolved === promises.length) {
              res(resolvedValueMap);
            }
          })
          .catch((reason) => rej(reason)),
      );
    });
  }

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
          resolve(onRejected(reason)); // Important, don't use reject(...) here
        } catch (error) {
          reject(reason);
        }
      });

      // This runs callbacks that can already be run, because they pertained to resolved promises
      this.#runCallbacks();
    });
  }

  catch(onRejected?: (reason: any) => never): MyPromise<T> {
    return this.then(undefined, onRejected);
  }

  finally(onFinally: () => void): MyPromise<T> {
    return this.then(onFinally, onFinally);
  }
}
