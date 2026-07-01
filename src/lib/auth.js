// We will use native fetch available in Node 18+
import open from 'open';
import { spinner, note, text } from '@clack/prompts';
import chalk from 'chalk';

// We will use native fetch available in Node 18+
// Replace this placeholder with the actual Client ID from GitHub OAuth App
export const CLIENT_ID = 'Ov23lipAkykcdDWVl593'; 

const SCOPE = 'repo workflow delete_repo user';

export async function authorizeDevice() {
  const s = spinner();
  s.start('Requesting authorization from GitHub...');

  try {
    // 1. Request device and user code
    const initResponse = await fetch('https://github.com/login/device/code', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        scope: SCOPE
      })
    });

    const initData = await initResponse.json();

    if (initData.error) {
      s.stop(chalk.red('Failed to request device code.'));
      console.error(chalk.red(initData.error_description || initData.error));
      process.exit(1);
    }

    s.stop('Device code received.');

    const { device_code, user_code, verification_uri, interval } = initData;

    note(
      `1. Open this URL in your browser: ${chalk.cyan(verification_uri)}\n` +
      `2. Enter the code: ${chalk.bold.green(user_code)}\n\n` +
      `(Your browser should open automatically in a moment...)`,
      'GitHub Authorization Required'
    );

    // Give the user a second to read before opening the browser
    setTimeout(async () => {
      try {
        await open(verification_uri);
      } catch (e) {
        // Ignore if we can't open the browser automatically
      }
    }, 2000);

    s.start('Waiting for you to authorize in your browser...');

    // 2. Poll for the access token
    let accessToken = null;
    let pollInterval = interval * 1000;

    while (!accessToken) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      const pollResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: CLIENT_ID,
          device_code: device_code,
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
        })
      });

      const pollData = await pollResponse.json();

      if (pollData.access_token) {
        accessToken = pollData.access_token;
      } else if (pollData.error === 'authorization_pending') {
        // User hasn't authorized yet, keep waiting
        continue;
      } else if (pollData.error === 'slow_down') {
        // GitHub wants us to poll slower
        pollInterval += 5000;
      } else {
        // Some other error occurred (e.g. expired, denied)
        s.stop(chalk.red('Authorization failed.'));
        console.error(chalk.red(pollData.error_description || pollData.error));
        process.exit(1);
      }
    }

    s.stop(chalk.green('Successfully authorized!'));
    return accessToken;

  } catch (error) {
    s.stop(chalk.red('An error occurred during authorization.'));
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}
