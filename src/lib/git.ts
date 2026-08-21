import { simpleGit, SimpleGit } from 'simple-git';

export function getGit(dir: string = process.cwd()): SimpleGit {
  return simpleGit(dir);
}

export async function isRepo(dir: string = process.cwd()): Promise<boolean> {
  const git = getGit(dir);
  return git.checkIsRepo();
}

export interface RepoInfo {
  owner: string;
  repo: string;
}

export async function getRepoInfo(dir: string = process.cwd()): Promise<RepoInfo | null> {
  const git = getGit(dir);
  try {
    const remotes = await git.getRemotes(true);
    const origin = remotes.find(r => r.name === 'origin');
    if (!origin) return null;
    
    const url = origin.refs.fetch;
    const match = url.match(/github\.com[:/](.+)\/(.+?)(\.git)?$/);
    if (match) {
      return { owner: match[1], repo: match[2] };
    }
  } catch (e) {
    return null;
  }
  return null;
}
