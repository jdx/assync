import assync from './assync'

test('compact', async () => {
  let result = await assync([1, null, 3, 4, 5, undefined, 6]).compact()
  expect(result).toEqual([1, 3, 4, 5, 6])
})
