export type Falsy = '' | 0 | false | null | undefined
export type MaybePromise<T> = Promise<T> | T

export type ReduceFn<T, TResult> = (prev: TResult, i: T) => MaybePromise<TResult>

export type PromiseInitFn<T> = () => {
  resolve: (value?: T | PromiseLike<T>) => void
  reject: (reason?: any) => void
}
export type AssyncConstructorInput<T> = PromiseInitFn<T[]> | MaybePromise<T[]>

export class Assync<T> extends Promise<T[]> {
  constructor(input: AssyncConstructorInput<T>) {
    if (input instanceof Function) {
      super(input)
    } else {
      super((resolve, reject) => {
        Promise.resolve(input || [])
          .then(resolve)
          .catch(reject)
      })
    }
  }

  flatMap<U>(this: Assync<U[]>): Promise<U[]> {
    const p = this.reduce((o, i) => o.concat(i), [] as U[])
    return new this.ctor(p)
  }

  compact<U>(this: Assync<U | Falsy>): Assync<U> {
    const p = this.reduce(
      (o, i) => {
        if (i) o.push(i)
        return o
      },
      [] as U[],
    )
    return new this.ctor(p)
  }

  reduce<U>(fn: ReduceFn<T, U>, initial: U): Promise<U> {
    const p = this.then(async input => {
      let agg = initial as U
      for (let p of input) {
        let i = await p
        agg = await fn(agg, await i)
      }
      return agg!
    })
    return p
  }

  private get ctor(): typeof Assync {
    return this.constructor as typeof Assync
  }
}

export default function assync<T>(items: MaybePromise<T[]>): Assync<T> {
  return new Assync(items)
}
