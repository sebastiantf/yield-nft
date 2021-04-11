const fs = require("fs");
const chalk = require("chalk");
const bre = require("hardhat");
var dir = require('node-dir');

const publishDir = "../react-app/src/contracts";
const graphDir = "../subgraph"

function publishContract(contractName) {
  console.log(
    " 💽 Publishing",
    chalk.cyan(contractName),
    "to",
    chalk.gray(publishDir)
  );
  const contractNameSplit = contractName.split('/');
  const contractNameHasSubdir = contractNameSplit.length > 1
  const contractNameWithSubdir = contractName
  contractName = contractNameHasSubdir ? contractNameSplit[1] : contractName
  const contractNameWithoutExtension = contractNameHasSubdir ? contractNameSplit[1].replace('.sol', '') : contractName;
  try {
    let contract = fs
      .readFileSync(`${bre.config.paths.artifacts}/contracts/${contractNameWithSubdir}.sol/${contractName}.json`)
      .toString();
    const address = fs
      .readFileSync(`${bre.config.paths.artifacts}/${contractNameWithoutExtension}.address`)
      .toString();
    contract = JSON.parse(contract);
    let graphConfigPath = `${graphDir}/config/config.json`
    let graphConfig
    try {
      if (fs.existsSync(graphConfigPath)) {
        graphConfig = fs
          .readFileSync(graphConfigPath)
          .toString();
      } else {
        graphConfig = '{}'
      }
      } catch (e) {
        console.log(e)
      }

    graphConfig = JSON.parse(graphConfig)
    graphConfig[contractName + "Address"] = address
    fs.writeFileSync(
      `${publishDir}/${contractName}.address.js`,
      `module.exports = "${address}";`
    );
    fs.writeFileSync(
      `${publishDir}/${contractName}.abi.js`,
      `module.exports = ${JSON.stringify(contract.abi, null, 2)};`
    );
    fs.writeFileSync(
      `${publishDir}/${contractName}.bytecode.js`,
      `module.exports = "${contract.bytecode}";`
    );

    const folderPath = graphConfigPath.replace("/config.json","")
    if (!fs.existsSync(folderPath)){
      fs.mkdirSync(folderPath);
    }
    fs.writeFileSync(
      graphConfigPath,
      JSON.stringify(graphConfig, null, 2)
    );
    fs.writeFileSync(
      `${graphDir}/abis/${contractName}.json`,
      JSON.stringify(contract.abi, null, 2)
    );

    console.log(" 📠 Published "+chalk.green(contractName)+" to the frontend.")

    return [true, contractNameWithoutExtension];
  } catch (e) {
    if(e.toString().indexOf("no such file or directory")>=0){
      console.log(chalk.yellow(" ⚠️  Can't publish "+contractName+" yet (make sure it getting deployed)."))
    }else{
      console.log(e);
      return [false, contractNameWithoutExtension];
    }
  }
}

async function main() {
  if (!fs.existsSync(publishDir)) {
    fs.mkdirSync(publishDir);
  }
  const finalContractList = [];
  var files = dir.files(bre.config.paths.sources, {sync:true});
  files = files.map(file=>file.replace(bre.config.paths.sources+'/', ''));
  files = files.filter(file=>!file.includes('interfaces'));
  console.log(files);
  files.forEach((file) => {
    if (file.indexOf(".sol") >= 0) {
      const contractName = file.replace(".sol", "");
      // Add contract to list if publishing is successful
      const [publishContractStatus, contractNameFinal] = publishContract(contractName);
      if (publishContractStatus) {
        finalContractList.push(contractNameFinal);
      }
    }
  });
  fs.writeFileSync(
    `${publishDir}/contracts.js`,
    `module.exports = ${JSON.stringify(finalContractList)};`
  );
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
