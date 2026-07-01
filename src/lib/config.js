import Conf from 'conf';

const config = new Conf({ projectName: 'pushit' });

export function getToken() {
  return config.get('github_token');
}

export function setToken(token) {
  config.set('github_token', token);
}

export function getUsername() {
  return config.get('github_username');
}

export function setUsername(username) {
  config.set('github_username', username);
}

export function clearConfig() {
  config.clear();
}
