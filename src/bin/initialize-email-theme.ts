#!/usr/bin/env node

import { downloadBuiltinKeycloakTheme } from "./download-builtin-keycloak-theme";
import { join as pathJoin, relative as pathRelative } from "path";
import { transformCodebase } from "./tools/transformCodebase";
import { promptKeycloakVersion } from "./promptKeycloakVersion";
import { readBuildOptions } from "./keycloakify/BuildOptions";
import * as fs from "fs";
import { getLogger } from "./tools/logger";
import { getThemeSrcDirPath } from "./getSrcDirPath";

export async function main() {
    const { isSilent } = readBuildOptions({
        "projectDirPath": process.cwd(),
        "processArgv": process.argv.slice(2)
    });

    const logger = getLogger({ isSilent });

    const { themeSrcDirPath } = getThemeSrcDirPath({
        "projectDirPath": process.cwd()
    });

    if (themeSrcDirPath === undefined) {
        logger.warn("Couldn't locate your theme source directory");

        process.exit(-1);
    }

    const emailThemeSrcDirPath = pathJoin(themeSrcDirPath, "email");

    if (fs.existsSync(emailThemeSrcDirPath)) {
        logger.warn(`There is already a ${pathRelative(process.cwd(), emailThemeSrcDirPath)} directory in your project. Aborting.`);

        process.exit(-1);
    }

    const { keycloakVersion } = await promptKeycloakVersion();

    const builtinKeycloakThemeTmpDirPath = pathJoin(emailThemeSrcDirPath, "..", "tmp_xIdP3_builtin_keycloak_theme");

    await downloadBuiltinKeycloakTheme({
        keycloakVersion,
        "destDirPath": builtinKeycloakThemeTmpDirPath,
        isSilent
    });

    transformCodebase({
        "srcDirPath": pathJoin(builtinKeycloakThemeTmpDirPath, "base", "email"),
        "destDirPath": emailThemeSrcDirPath
    });

    {
        const themePropertyFilePath = pathJoin(emailThemeSrcDirPath, "theme.properties");

        fs.writeFileSync(themePropertyFilePath, Buffer.from(`parent=base\n${fs.readFileSync(themePropertyFilePath).toString("utf8")}`, "utf8"));
    }

    logger.log(`${pathRelative(process.cwd(), emailThemeSrcDirPath)} ready to be customized, feel free to remove every file you do not customize`);

    fs.rmSync(builtinKeycloakThemeTmpDirPath, { "recursive": true, "force": true });
}

if (require.main === module) {
    main();
}
