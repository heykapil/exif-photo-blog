import path from 'path';
import { spawn } from 'node:child_process';
import fs from 'fs';
import 'dotenv/config';
const syncContentFromGit = async () => {
  const syncRun = async () => {
    const ORG_ID = process.env.TEMBO_ORG_ID;
    const INST_ID = process.env.TEMBO_INST_ID;
    const token = process.env.TEMBO_TOKEN;
    const Url = `https://api.data-1.use1.tembo.io/api/v1/orgs/${ORG_ID}/instances/${INST_ID}/secrets/certificate`;
    await runBashCommand(`
      curl -s -X 'GET' \
        ${Url} \
        -H 'accept: application/json' \
        -H "Authorization: Bearer ${token}" \
        -H 'Content-Type: application/json' \
        -o ca.crt
    `);
    let rawdata = fs.readFileSync('./ca.crt');
    let ca = JSON.parse(rawdata);
    for (var key in ca) {
      try {
        fs.writeFileSync('./ca.crt', ca[key]);
        fs.writeFileSync('./src/services/ca.crt', ca[key]);
        console.log('Writing Certificate...');
      } catch (err) {
        console.error(err);
      }
    }
  };

  let wasCancelled = true;
  let syncInterval;

  const syncLoop = async () => {
    console.log('Downloading CA certificate from Tembo API...');
    await syncRun();

    if (wasCancelled) return;

    syncInterval = setTimeout(syncLoop, 1000 * 60);
  };

  // Block until the first sync is done
  await syncLoop();

  return () => {
    wasCancelled = true;
    clearTimeout(syncInterval);
  };
};

const runBashCommand = (command) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, [], { shell: true });

    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (data) => process.stdout.write(data));

    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (data) => process.stderr.write(data));

    child.on('close', function (code) {
      if (code === 0) {
        resolve(void 0);
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
  });

(async () => {
  await syncContentFromGit();
})();
