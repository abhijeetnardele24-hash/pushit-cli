import { Octokit } from '@octokit/rest';
import { getToken } from './config.js';

export function getOctokit(overrideToken?: string | null): Octokit {
  const token = overrideToken || getToken();
  return new Octokit({ auth: token });
}

export async function validateToken(token: string): Promise<any | null> { // Using any for authenticated user response for now, @octokit/types can be complex
  const octokit = new Octokit({ auth: token });
  try {
    const { data } = await octokit.rest.users.getAuthenticated();
    return data;
  } catch (error: any) {
    return null;
  }
}
