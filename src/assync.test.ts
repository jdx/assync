import assync from './assync'

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
})
