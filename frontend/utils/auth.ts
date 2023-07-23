import { redirect } from './redirect';
import logger from '../helpers/logger';
import Cookies from 'universal-cookie';
import useApiClient from '../helpers/api';

const cookies = new Cookies();
const apiClient = useApiClient();

async function handleLogin(access_token: string, refresh_token: string) {
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
  window.localStorage.setItem('logout', Date.now().toString());
  redirect('/');
}

async function authCheck(): Promise<boolean> {
  if (!!cookies.get('access_token')) {
    logger.log('auth.isAuthenticated');
    const whoAmI = await apiClient.makeRequest( 'GET', '/customers/who-am-i/')
    console.log(whoAmI)
    if (whoAmI.status !== 200) {
      const refreshToken = await apiClient.makeRequest(
        'POST',
        '/customers/token/refresh/',
        {refresh:localStorage.getItem('refresh_token')}
        )
      if (refreshToken.status === 200) {
        handleLogin(refreshToken.data.access_token, refreshToken.data.refresh_token)
      }
    }
    return true;
  } else {
    return false;
  }
}

export { handleLogin, logout, authCheck };
