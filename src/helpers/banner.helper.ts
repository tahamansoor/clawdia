import { Logger } from "../index";
import { readFileSync } from "fs";
import { join } from "path";

function getPackageInfo(path: string) {
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return {};
  }
}

export function showBanner() {
  const clawdiaPkg = getPackageInfo(join(__dirname, "../../package.json"));
  const projectPkg = getPackageInfo(process.cwd() + "/package.json");

  const now = new Date().toLocaleString();

  const banner = `
    ______ __     ___  _       __ ____   ____ ___
   / ____// /    /   || |     / // __ \ /  _//   |
  / /    / /    / /| || | /| / // / / / / / / /| |
 / /___ / /___ / ___ || |/ |/ // /_/ /_/ / / ___ |
 \____//_____//_/  |_||__/|__//_____//___//_/  |_|🐾

      Framework:     Clawdia v${clawdiaPkg.version || "?"}
      Project Name:  ${projectPkg.name || "Unknown"}
      Project Ver:   ${projectPkg.version || "?"}
      Author:        ${clawdiaPkg.author || "?"}
      Started At:    ${now}
  `;

  console.log(banner);
  Logger.info("Clawdia is purring... ready to claw into action.", "Clawdia");
}
