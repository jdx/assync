/**
 * @module assync
 */

export type Falsy = '' | 0 | false | null | undefined
export type MaybePromise<T> = T | PromiseLike<T>

export type ReduceFn<T, TResult> = (prev: TResult, i: T) => MaybePromise<TResult>

export type PromiseInitFn<T> = () => {
  resolve: (value?: T | PromiseLike<T>) => void
  reject: (reason?: any) => void
}

export type AssyncConstructorInput<T> = PromiseInitFn<T[]> | MaybePromise<T[]> | MaybePromise<T>[]

function isPromiseInitFn<T>(i: AssyncConstructorInput<T>): i is PromiseInitFn<T[]> {
  return typeof i === 'function'
}

function isParallel<T>(i: AssyncConstructorInput<T>): i is MaybePromise<T>[] {
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
  private parallel?: PromiseLike<T>[]

  constructor(input: AssyncConstructorInput<T>) {
    if (isPromiseInitFn(input)) {
      super(input)
      return this
    }
    if (isParallel(input)) {
      let f: MaybePromise<T>[] = input
      let promises = f.map(i => Promise.resolve(i))
      super((resolve, reject) => {
        Promise.resolve(Promise.all(promises))
          .then(resolve)
          .catch(reject)
      })
      this.parallel = promises
    } else {
      super((resolve, reject) => {
        Promise.resolve(input || [])
          .then(input => resolve(input || []))
          .catch(reject)
      })
    }
  }

  compact<U>(this: Assync<U | Falsy>): Assync<U> {
    return this.filter((i): i is U => !!i)
  }

  filter<U extends T>(fn: (i: T) => i is U): Assync<U>
  filter(fn: (i: T) => MaybePromise<boolean>): Assync<T>
  filter(fn: (i: T) => MaybePromise<boolean>): Assync<T> {
    return new Assync(
      this.reduce(
        async (o, i) => {
          if (await fn(i)) o.push(i)
          return o
        },
        [] as T[],
      ),
    )
  }

  flatMap<U>(fn: (i: T) => U[]): Assync<U>
  flatMap<U>(this: Assync<U[]>): Assync<U>
  flatMap<U>(this: Assync<any>, fn?: (i: T) => U[]): Assync<U> {
    const p = this.reduce(
      async (o, i) => {
        return fn ? o.concat(await fn(i)) : o.concat(i)
      },
      [] as U[],
    )
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
    let p
    if (this.parallel) {
      p = this.parallel.map(i => i.then(fn))
    } else {
      p = this.then(i => new Assync<U>(i.map(fn)))
    }
    return new Assync<U>(p)
  }

  private get ctor(): typeof Assync {
    return this.constructor as typeof Assync
  }
}

export default function assync<T>(items: MaybePromise<T[]>): Assync<T> {
  return new Assync(items)
}

export { assync }
