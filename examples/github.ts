const { HTTP } = require('http-call')
const { assync } = require('assync')

async function main() {
  const output = await assync(['jdxcode']) // start with github user 'jdxcode'
    .map(userID => HTTP.get(`https://api.github.com/users/${userID}`))
  console.dir(output)
}
main()
