const byteSize = require("byte-size");
const cacache = require("cacache");
const columnify = require("columnify");
const fs = require("graceful-fs");
const log = require("npmlog");
const move = require("move-concurrently");
const path = require("path");
const ssri = require("ssri");
const tar = require("tar");
const lifecycle = require("./utils/lifecycle");
const output = require("./utils/output");
const packlist = require("./utils/packlist");
const usage = require("./utils/usage");
const appframe = require("./appframe");

async function pack(args, silent = false) {
  if (args.length === 0) {
    args = ".";
  }

  const cwd = process.cwd();
  const promises = args.map(arg => packSingle(arg));
  const tarballs = await Promise.all(promises);
  if (!silent) {
    tarballs.forEach(logContents);
    output(tarballs.map(file => path.relative(cwd, file.filename)).join("\n"));
  }
}

function packSingle(dir) {
  const dryRun = appframe.config.get("dry-run");

  return prepareDirectory(dir).then(pkg => {
    let name =
      pkg.name[0] === "@" ? pkg.name.substr(1).replace(/\//g, "-") : pkg.name;

    const target = `${name}-${pkg.version}.tgz`;
    return packDirectory(pkg, dir, target, target, dryRun);
  });
}

function packDirectory(pkg, dir, target, fileName, dryRun) {
  return lifecycle(pkg, "prepack", dir).then(() => {
    return cacache.tmp.withTmp(appframe.tmp, { tmpPrefix: "packing" }, tmp => {
      const tmpTarget = path.join(tmp, path.basename(target));
      const tarOpt = {
        file: tmpTarget,
        cwd: dir,
        // Provide a specific date in the 1980s for the benefit of zip,
        // which is confounded by files dated at the Unix epoch 0.
        mtime: new Date("1985-10-26T08:15:00.000Z"),
        gzip: true
      };
      const files = packlist(pkg, dir);

      const packPromise = new Promise(resolve => {
        tar.create(tarOpt, files.map(file => `./${file}`), resolve);
      });

      return packPromise
        .then(() => getContents(pkg, tmpTarget, fileName))
        .then(() => {
          if (dryRun) {
            log.verbose("pack", "--dry-run mode enabled. Skipping write.");
          } else {
            return move(tmpTarget, target, { fs });
          }
        })
        .then(() => lifecycle(pkg, "postpack", dir));
    });
  });
}

function prepareDirectory(dir) {
  const pkg = require(path.resolve(dir, "package.json"));
  if (!pkg.name) {
    throw new Error("package.json requires a 'name' field'");
  }
  if (!pkg.version) {
    throw new Error("package.json requires a valid 'version' field");
  }

  return lifecycle(pkg, "prepare", dir).then(() => pkg);
}

function getContents(pkg, target, filename) {
  const files = [];
  let totalEntries = 0;
  let totalEntrySize = 0;

  return tar
    .t({
      file: target,
      onentry(entry) {
        totalEntries++;
        totalEntrySize += entry.size;
        files.push({
          path: entry.path,
          size: entry.size,
          mode: entry.mode
        });
      },
      strip: 1
    })
    .then(() =>
      Promise.all([
        new Promise(resolve => fs.stat(target, resolve)),
        ssri.fromStream(fs.createReadStream)
      ])
    )
    .then(([stat, integrity]) => {
      const shasum = integrity["sha1"][0].hexDigest();

      return {
        name: pkg.name,
        version: pkg.version,
        size: stat.size,
        unpackedSize: totalEntrySize,
        shasum,
        integrity: ssri.parse(integrity["sha512"][0]),
        filename,
        files,
        entryCount: totalEntries
      };
    });
}

function logContents(tarball) {
  log.notice("");
  log.notice(
    "",
    `${appframe.config.get("unicode") ? "📦 " : "package:"} ${tarball.name}@${
      tarball.version
    }`
  );
  log.notice("=== Tarball Contents ===");

  if (tarball.files.length) {
    log.notice(
      "",
      columnify(
        tarball.files.map(file => {
          const bytes = byteSize(file.size);
          return { path: file.path, size: `${bytes.value}${bytes.unit}` };
        }),
        {
          include: ["size", "path"],
          showHeaders: false
        }
      )
    );
  }

  log.notice("=== Tarball Details ===");
  log.notice(
    "",
    columnify(
      [
        { name: "name:", value: tarball.name },
        { name: "version:", value: tarball.version },
        tarball.filename && { name: "filename:", value: tarball.filename },
        { name: "package size:", value: byteSize(tarball.size) },
        { name: "unpacked size:", value: byteSize(tarball.unpackedSize) },
        { name: "shasum:", value: tarball.shasum },
        {
          name: "integrity:",
          value:
            tarball.integrity.toString().substr(0, 20) +
            "[...]" +
            tarball.integrity.toString().substr(80)
        },
        tarball.bundled.length && {
          name: "bundled deps:",
          value: tarball.bundled.length
        },
        tarball.bundled.length && {
          name: "bundled files:",
          value: tarball.entryCount - tarball.files.length
        },
        tarball.bundled.length && {
          name: "own files:",
          value: tarball.files.length
        },
        { name: "total files:", value: tarball.entryCount }
      ].filter(x => x),
      {
        include: ["name", "value"],
        showHeaders: false
      }
    )
  );
  log.notice("", "");
}

pack.usage = usage(
  "appframe",
  `
appframe pack [<directory>]`,
  "[--dry-run]"
);

module.exports = pack;
module.exports.getContents = getContents;
module.exports.logContents = logContents;
module.exports.prepareDirectory = prepareDirectory;
module.exports.packDirectory = packDirectory;
