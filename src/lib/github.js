import { Octokit } from '@octokit/rest';
import { getToken } from './config.js';

export function getOctokit(overrideToken) {
  const token = overrideToken || getToken();
  return new Octokit({ auth: token });
}

export async function validateToken(token) {
  const octokit = new Octokit({ auth: token });
  try {
    const { data } = await octokit.rest.users.getAuthenticated();
    return data;
  } catch (error) {
    return null;
  }
}
