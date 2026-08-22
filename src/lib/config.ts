import Conf from 'conf';

const config = new Conf<{ github_token?: string, github_username?: string, ai_key?: string }>({ projectName: 'pushit' });

export function getToken(): string | undefined {
  return config.get('github_token');
}

export function setToken(token: string | null): void {
  if (token) config.set('github_token', token);
  else config.delete('github_token');
}

export function getUsername(): string | undefined {
  return config.get('github_username');
}

export function setUsername(username: string | null): void {
  if (username) config.set('github_username', username);
  else config.delete('github_username');
}

export function getAiKey(): string | undefined {
  return config.get('ai_key');
}

export function setAiKey(key: string | null): void {
  if (key) config.set('ai_key', key);
  else config.delete('ai_key');
}

export function clearConfig(): void {
  config.clear();
}
