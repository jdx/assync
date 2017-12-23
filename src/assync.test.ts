import assync from './assync'

const wait = (ms = 100) => new Promise(resolve => setTimeout(resolve, ms))
const flushPromises = () => new Promise(resolve => setImmediate(resolve))
const tick = async (until: Promise<any>) => {
  let p = await Promise.race([until.then(() => 'done'), flushPromises()])
  if (p === 'done') return
  jest.advanceTimersByTime(1000)
  tick(until)
}

jest.useFakeTimers()

test('accepts undefined', async () => {
  let input = assync(undefined as any)
  let output = await input.compact()
  expect(output).toEqual([])
})

test('accepts undefined promise', async () => {
  let input = assync(Promise.resolve(undefined) as any)
  let output = await input.compact()
  expect(output).toEqual([])
})

describe('compact', () => {
  test('ok', async () => {
    let input = assync([1, null, 3, 4, 5, undefined, 6])
    let output = await input.compact()
    expect(output).toEqual([1, 3, 4, 5, 6])
  })
})

describe('filter', () => {
  test('ok', async () => {
    let input = assync([1, 2, 3, 4, 5, 6])
    let output = await input.filter(i => i % 2 === 0)
    expect(output).toEqual([2, 4, 6])
  })
})

describe('flatMap', () => {
  test('ok', async () => {
    let input = assync([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
    let output = await input.flatMap()
    expect(output).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  test('fn', async () => {
    let input = assync(['foo:bar', 'baz:bak'])
    let output = await input.flatMap(i => i.split(':'))
    expect(output.join('x')).toEqual('fooxbarxbazxbak')
  })
})

describe('reduce', () => {
  test('ok', async () => {
    let input = assync([1, 2, 3, 4, 5])
    let output = await input.reduce((o, i) => (o ? o + i : i), 0)
    expect(output).toEqual(15)
  })
})

describe('map', () => {
  test('ok', async () => {
    let input = assync([1, 2, 3])
    let output = await input.map(i => (i * 2).toString())
    expect(output).toEqual(['2', '4', '6'])
  })

  test('parallel', async () => {
    let input = assync([1, 10, 1, 5])
    let order: number[] = []
    let fn = async (i: number) => {
      await wait(i * 1000)
      order.push(i)
      return i * 2
    }
    let output = input
      .map(fn)
      .map(fn)
      .map(fn)
      .map(fn)
      .map(fn)
      .map(fn)
    tick(output)
    expect(await output).toEqual([64, 640, 64, 320])
    expect(order).toEqual([1, 1, 2, 2, 5, 4, 4, 10, 10, 8, 8, 20, 16, 16, 20, 32, 32, 40, 40, 80, 80, 160, 160, 320])
  })
})

test('map + filter in parallel', async () => {
  let input = assync([1, 10, 1, 5])
  let order: number[] = []
  let mapFn = async (i: number) => {
    await wait(i * 1000)
    return i * 2
  }
  let filterFn = async (i: number) => {
    await wait(i * 1000)
    order.push(i)
    return true
  }
  let output = input
    .map(mapFn)
    .filter(filterFn)
    .map(mapFn)
    .filter(filterFn)
    .map(mapFn)
    .filter(filterFn)
  tick(output)
  await output
  expect(order).toEqual([2, 20, 2, 10, 4, 40, 4, 20, 8, 80, 8, 40])
})
