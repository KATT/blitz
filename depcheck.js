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

let spinner = ora('').start()
async function main() {
  const dirs = [
    __dirname,
    ...getDirectories(path.join(__dirname, 'packages')),
  ]

  const results = []
  for (const [index, dir] of dirs.entries()) {
    spinner.text = `${index + 1}/${dirs.length} Checking ${dir}`

    const check = await depcheck(dir, options)

    results.push({
      dir,
      unusedDeps: check.dependencies.sort(),
      unusedDevDeps: check.devDependencies.sort(),
      occurrences: Object.entries(check.using)
        .sort((a, b) => a[1].length - b[1].length)
        .reduce((sum, [name, files]) => ([
          ...sum,
          {
            name,
            occurrences: files.length,
          },
        ]), [])
    })
  }
  spinner.succeed('Done. Printing results.\n')

  for (const result of results) {
    console.log(`Dir: ${result.dir}:\n`)
    console.log('Unused deps:', result.unusedDeps)
    console.log('Unused deps:', result.unusedDevDeps)
    console.log('Occurrences:')
    console.table(result.occurrences)
    console.log('\n--------------------------------\n')
  }

}

main().catch((err) => {
  spinner.error()
  console.error(err);
  process.exit(1)
})