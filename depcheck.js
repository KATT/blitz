const depcheck = require('depcheck');
const fs = require('fs')
const path = require('path')
const ora = require('ora')

const options = {
  ignoreBinPackage: false, // ignore the packages with bin entry
  skipMissing: true, // skip calculation of missing 
  ignorePatterns: [
    'tsconfig.build.json'
  ]
};
const isDirectory = source => fs.lstatSync(source).isDirectory()
const getDirectories = source =>
  fs.readdirSync(source).map(name => path.join(source, name)).filter(isDirectory)


async function main() {
  let spinner = ora('').start()
  const dirs = getDirectories(path.join(__dirname, 'packages'))

  const result = {};
  for (const [index, dir] of dirs.entries()) {
    spinner.text = `${index + 1}/${dirs.length} Checking ${dir}`

    const check = await depcheck(dir, options)
    for (const [name, files] of Object.entries(check.using)) {
      result[name] = result[name] ?? []
      result[name].push(...files)
    }
  }

  spinner.text = 'Aggregating results'

  const aggregated = Object.entries(result)
    .sort((a, b) => a[1].length - b[1].length)
    .reduce((sum, [name, files]) => ([
      ...sum,
      {
        name,
        occurrences: files.length,
      },
    ]), [])

  spinner.succeed('Done!')

  console.table(aggregated)
}

main().catch((err) => {
  console.error(err);
  process.exit(1)
})