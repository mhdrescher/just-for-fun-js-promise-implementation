import { setTimeout } from "node:timers";

export class MyPromise<T> {
  #PromiseState: "pending" | "fulfilled" | "rejected" = "pending";
  #PromiseResult: T | undefined = undefined;
  #PromiseFullfillReactions: ((value: T) => T)[] = [];
  // #PromiseRejectReations: any;

  constructor(
    executor: (
      resolve: (value: T) => void,
      reject: (reason: any) => void,
    ) => void,
  ) {
    const onResolve = (value: T) => {
      queueMicrotask(() => {
        if (this.#PromiseState !== "pending") return;
        this.#PromiseResult = value;
        this.#PromiseState = "fulfilled";
        this.#runCallbacks();
      });
    };
    const onReject = (reason: any) => {
      if (this.#PromiseState !== "pending") return;
      this.#PromiseResult = reason;
      this.#PromiseState = "rejected";
    };

    executor(onResolve, onReject);
  }

  #runCallbacks() {
    this.#PromiseFullfillReactions.forEach(
      (reaction) => this.#PromiseResult && reaction(this.#PromiseResult),
    );
  }

  // Static methods
  // DON'T confuse with the functions being passed into the constructor!
  static resolve<T>(value: T): void {}
  static reject: () => {};

  // Instance methods
  then(
    onFullfilled?: ((value: T) => T) | null | undefined,
    onRejected?: (reason: any) => never,
  ) {
    onFullfilled && this.#PromiseFullfillReactions.push(onFullfilled);
  }

  catch() {}
  finally() {}
}
