import { redirect } from './redirect';
import logger from '../helpers/logger';
import Cookies from 'universal-cookie';

const cookies = new Cookies();

async function handleLogin(access_token: string, refresh_token: string) {
  logger.log('auth.handleLogin', access_token);
  cookies.set('access_token', access_token);
  cookies.set('refresh_token', refresh_token);
}

function logout() {
  logger.log('auth.logout');
  cookies.remove('access_token');
  cookies.remove('refresh_token');

  // to support logging out from all windows
  window.localStorage.setItem('logout', Date.now().toString());
  redirect('/');
}

 function authCheck(): boolean {
  if (!!cookies.get('access_token')) {
    logger.log('auth.isAuthenticated');
    return true;
  } else {
    return false;
  }
}

export { handleLogin, logout, authCheck };
