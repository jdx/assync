import assync from './assync'

const wait = (ms = 100) => new Promise(resolve => setTimeout(resolve, ms))
const flushPromises = () => new Promise(resolve => setImmediate(resolve))

jest.useFakeTimers()

test('accepts undefined', async () => {
  let input = assync(undefined as any)
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
      order.push(i)
      await wait(i * 1000)
      return i + 1
    }
    let output = input
      .map(fn)
      .map(fn)
      .map(fn)
      .map(fn)
      .map(fn)
      .map(fn)
    let tick = async () => {
      let p = await Promise.race([output, flushPromises()])
      if (p) return
      jest.advanceTimersByTime(1000)
      tick()
    }
    tick()
    expect(await output).toEqual([7, 16, 7, 11])
    expect(order).toEqual([1, 10, 1, 5, 2, 2, 3, 3, 6, 4, 4, 11, 5, 5, 7, 6, 6, 8, 12, 9, 13, 10, 14, 15])
  })
})
