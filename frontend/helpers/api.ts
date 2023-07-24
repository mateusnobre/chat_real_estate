import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import logger from './logger';
import Cookies from 'universal-cookie';

const cookies = new Cookies();
let refresh = false;

const getBaseUrl = (): string => {
  const BASE_URL =
    process.env.NODE_ENV === 'production'
      ? 'https://chat-real-estate-backend.onrender.com'
      : 'http://127.0.0.1:8000';
  return BASE_URL;
};


axios.interceptors.response.use(resp => resp, async error => {
    if ((error.response.status === 401 || error.response.status === 500) && !refresh) {
        refresh = true;
        let baseUrl = getBaseUrl();
        let requestUrl = baseUrl + "/customers/token/refresh/";
        const refreshToken =cookies.get('refresh_token')
        const response: AxiosResponse = await axios.post(
          requestUrl, 
          {"refresh":refreshToken}, 
          {
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );

        if (response.status === 200) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${response.data['access']}`;
            cookies.set('access_token', response.data.access);
            cookies.set('refresh_token', response.data.refresh);
            window.location.reload();
            return axios(error.config);
        }
    }
    refresh = false;
    return error;
});

const useApiClient = () => {
  const makeRequest = async (
    method: string,
    url: string,
    data?: any
  ): Promise<any> => {
    let requestData = data || {};
    let baseUrl = getBaseUrl();
    let requestUrl = baseUrl + url;
    let isPOST = ['post', 'put'].includes(method.toLowerCase());
    logger.log('APIclient.makeRequest.requestUrl', requestUrl);
    try {
      let headers: any = {
        'content-type': isPOST ? 'multipart/form-data' : 'application/json',
        'Access-Control-Allow-Origin': '*',
      };
      if (cookies.get('access_token') !== undefined) {
        headers = {
          'content-type': isPOST ? 'multipart/form-data' : 'application/json',
          'Authorization': 'Bearer ' + cookies.get('access_token'),
          'Access-Control-Allow-Origin': '*',
        };
      }
      const options: AxiosRequestConfig = {
        method: method,
        url: requestUrl,
        withCredentials: false,
        headers: headers,
        data: isPOST ? requestData : null,
      };
      const response: AxiosResponse = await axios(options);
      if (response.status === 200 || response.status === 201) {
        return {
          headers: response.headers,
          status: response.status,
          data: response.data,
        };
      } else {
        logger.log(
          'APIclient.makeRequest.response.notOkay',
          response.statusText,
        );
        throw new Error(response.statusText);
      }
    } catch (err) {
      logger.log('APIclient.makeRequest.error', err);
      throw new Error(err);
    }
  };

  return {
    makeRequest,
  };
};

export default useApiClient;
