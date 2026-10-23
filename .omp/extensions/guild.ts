// Guild's coordinator hooks for this project, written by `guild init`. Do not edit: delete it and run `guild init`
// again to get the current version.
//
// OMP loads every file in .omp/extensions/ for a session started in this project. This stub loads the
// coordinator's hooks from the installed Guild package: `$GUILD_PACKAGE` if set, otherwise the package that
// `guild` on PATH points to. Hooks the installed Guild does not have yet are skipped. Guild jobs never load this
// file: they run with --no-extensions and get their own hooks through --extension flags.

import { existsSync, realpathSync } from "node:fs";
import { delimiter, dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

const COORDINATOR_HOOKS = ["context", "wake"] as const;

export default async function guild(api: unknown): Promise<void> {
	if (process.env.GUILD_JOB === "1") {
		return;
	}
	const root = process.env.GUILD_PACKAGE?.trim() || findPackage();
	for (const name of COORDINATOR_HOOKS) {
		const file = join(root, "hook", `${name}.ts`);
		if (!existsSync(file)) {
			continue;
		}
		const hook: { default: (api: unknown) => unknown } = await import(pathToFileURL(file).href);
		await hook.default(api);
	}
}

function findPackage(): string {
	for (const dir of (process.env.PATH ?? "").split(delimiter)) {
		const bin = dir === "" ? "" : join(dir, "guild");
		if (bin !== "" && existsSync(bin)) {
			return dirname(dirname(realpathSync(bin)));
		}
	}
	throw new Error("guild is not on PATH and GUILD_PACKAGE is not set; cannot load Guild's coordinator hooks");
}
