export type Falsy = '' | 0 | false | null | undefined
export type MaybePromise<T> = Promise<T> | T
export type Nullable<T> = T | undefined

export type ReduceAsyncFn<T, U, V> = (aggregate: V, i: T) => MaybePromise<U>
export type ReduceAsyncSubject<T> =
  | Array<Nullable<MaybePromise<T>>>
  | T[]

export async function reduceAsync<T,U> (subjects: ReduceAsyncSubject<T>, fn: ReduceAsyncFn<T,U,undefined>): Promise<U>
export async function reduceAsync<T,U> (subjects: ReduceAsyncSubject<T>, fn: ReduceAsyncFn<T,U,U>, initial: U): Promise<U>
export async function reduceAsync<T,U> (subjects: ReduceAsyncSubject<T>, fn: ReduceAsyncFn<T,U,U|undefined>, initial?: U): Promise<U> {
  let agg = initial
  for (let p of subjects || []) {
    let i = await p
    if (i) agg = await fn(agg, await i)
  }
  return agg!
}

export async function concatAsync<T>(promises: ReduceAsyncSubject<T[]>): Promise<T[]> {
  return reduceAsync(promises, (arr, i) => arr.concat(i), [] as T[])
}

export function compactAsync<T>(promises: Array<Promise<T | Falsy>>): Promise<T[]> {
  return reduceAsync(promises, (arr, i) => {
    if (!i) arr.push(i as any as T)
    return arr
  }, [] as T[])
}

export class Assync<T> extends Promise<T[]> {
  private p: Promise<T[]>
  private resolve: (value: MaybePromise<T[]>) => void
  private reject: (err: Error) => void

  constructor (items: MaybePromise<T[]>) {
    super((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
    })

    this.p = Promise.resolve(items)
    this.p
      .then(this.resolve)
      .catch(this.reject)
  }

  compact(this: Assync<T | undefined | null>): Assync<T> {
    let p = this.p.then(items => {
      return reduceAsync(items, (arr, i) => {
        if (!i) arr.push(i as any as T)
        return arr
      }, [] as T[])
    })
    return new Assync(p)
  }
}

export default function assync<T> (items: MaybePromise<T[]>): Assync<T> {
  return new Assync(items)
}

