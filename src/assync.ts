/**
 * @module assync
 */

export type Falsy = '' | 0 | false | null | undefined
export type MaybePromise<T> = Promise<T> | T

export type ReduceFn<T, TResult> = (prev: TResult, i: T) => MaybePromise<TResult>

export type PromiseInitFn<T> = () => {
  resolve: (value?: T | PromiseLike<T>) => void
  reject: (reason?: any) => void
}
export type AssyncConstructorInput<T> = PromiseInitFn<T[]> | MaybePromise<T[]> | Promise<T>[]

function isParallel<T>(i: AssyncConstructorInput<T>): i is Promise<T>[] {
  return Array.isArray(i)
}

/**
 * @class Aasync
 * Main assync class
 *
 * @example
 * const {assync} = require('assync')
 *
 * async function main () {
 *   const output = await assync([1, null, 3]).filter(i => i !== null)
 *   console.dir(output)
 * }
 * main()
 */
export class Assync<T> extends Promise<T[]> {
  private parallel?: Promise<T>[]

  constructor(input: AssyncConstructorInput<T>) {
    if (input instanceof Function) {
      super(input)
      return this
    } else {
      let parallel
      super((resolve, reject) => {
        let p
        if (isParallel(input)) {
          parallel = input.map(i => Promise.resolve(i))
          p = Promise.all(parallel)
        } else {
          p = Promise.resolve(input || [])
        }
        p.then(resolve).catch(reject)
      })
      this.parallel = parallel
    }
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

  filter(fn: (i: T) => boolean): Assync<T> {
    const p = this.reduce(
      async (o, i) => {
        if (await fn(i)) o.push(i)
        return o
      },
      [] as T[],
    )
    return new this.ctor(p)
  }

  flatMap<U>(this: Assync<U[]>): Promise<U[]> {
    const p = this.reduce((o, i) => o.concat(i), [] as U[])
    return new this.ctor(p)
  }

  /**
   * The reduce() method applies a function against an accumulator and each element in the array (from left to right) to reduce it to a single value.
   *
   * @async
   * @param {Function} - function to call on each element
   * @returns {Promise}
   * @fulfil {any} - The result of the functions
   *
   *
   * @example
   * let input = assync([1, 2, 3, 4, 5])
   * let output = await input.reduce((o, i) => (o ? o + i : i), 0)
   * expect(output).toEqual(15)
   */
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

  map<U>(fn: (i: T) => MaybePromise<U>): Assync<U> {
    if (this.parallel) {
      const p = this.parallel.map(i => i.then(fn))
      return new this.ctor<U>(p)
    } else {
      const p = this.then(i => Promise.all(i.map(fn)))
      return new this.ctor(p)
    }
  }

  private get ctor(): typeof Assync {
    return this.constructor as typeof Assync
  }
}

export default function assync<T>(items: MaybePromise<T[]>): Assync<T> {
  return new Assync(items)
}

export { assync }
