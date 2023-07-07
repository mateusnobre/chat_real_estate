import { redirect } from './redirect.js';
import logger from '../helpers/logger';
import Cookies from 'universal-cookie';
const cookies = new Cookies();

async function handleLogin(access_token, refresh_token) {

  logger.log('auth.handleLogin', access_token);
  cookies.set('access_token', access_token);
  cookies.set('refresh_token', refresh_token);
}

function logout() {
  logger.log('auth.logout');
  cookies.remove('access_token');
  cookies.remove('refresh_token');
  cookies.remove('customer_id');

  // to support logging out from all windows
  window.localStorage.setItem('logout', Date.now());
  redirect('/');
}

function authCheck() {
  logger.log('auth.isAuthenticated');
  if (!!cookies.get('access_token')) {
    return true;
  }
  else {
    return false
  }
}

export { handleLogin, logout, authCheck };
