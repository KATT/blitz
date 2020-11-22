import next from "next"
import { build } from "./build"
import { alreadyBuilt } from "./build-hash"
import { normalize, ServerConfig } from "./config"
import { configureStages } from "./stages"

const debug = require("debug")("blitz:create-blitz-app")
interface CreateBlitzAppConfig {
  dev: boolean
}

export async function createBlitzApp({ dev }: CreateBlitzAppConfig) {
  const serverConfig: ServerConfig = {
    env: dev ? "dev" : "prod",
    rootFolder: process.cwd(),
    // port
    // hostname
    // inspect
    // clean: flags["no-incremental-build"],
  }
  const {
    rootFolder,
    transformFiles,
    devFolder,
    ignore,
    include,
    isTypescript,
    writeManifestFile,
    watch,
    clean,
    buildFolder,
  } = await normalize({ ...serverConfig, env: "dev" })

  if (dev) {
    // dev
    const stages = configureStages({ writeManifestFile, isTypescript })

    await transformFiles(rootFolder, stages, devFolder, {
      ignore,
      include,
      watch,
      clean,
    })
  } else {
    // prod
    if (!(await alreadyBuilt(buildFolder))) {
      debug("not built - building..")
      await build(serverConfig)
      debug('build done.')
    } else {
      debug("already built")
    }
  }
  const dir = dev ? devFolder : buildFolder
  const app = next({ dev, dir })
  const requestHandler = app.getRequestHandler()

  await app.prepare()

  return {
    requestHandler,
  }
}
