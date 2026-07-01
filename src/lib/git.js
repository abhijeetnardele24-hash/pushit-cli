import simpleGit from 'simple-git';

export function getGit(dir = process.cwd()) {
  return simpleGit(dir);
}

export async function isRepo(dir = process.cwd()) {
  const git = getGit(dir);
  return git.checkIsRepo();
}

export async function getRepoInfo(dir = process.cwd()) {
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
