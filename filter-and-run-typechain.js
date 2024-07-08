const glob = require("glob");
const { exec } = require("child_process");

const pattern = "artifacts/contracts/**/*.json";
const ignorePattern = "artifacts/contracts/**/*.dbg.json";

glob(pattern, { ignore: ignorePattern }, (err, files) => {
  if (err) {
    console.error("Error while matching files:", err);
    process.exit(1);
  }

  const fileArgs = files.join(" ");
  const command = `typechain --target ethers-v6 --out-dir src/types ${fileArgs}`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error while running TypeChain: ${error}`);
      return;
    }

    console.log(stdout);
    console.error(stderr);
  });
});
