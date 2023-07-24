import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import logger from './logger';
import Cookies from 'universal-cookie';

const cookies = new Cookies();

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

  const getBaseUrl = (): string => {
    const BASE_URL =
      process.env.NODE_ENV === 'production'
        ? 'https://chat-real-estate-backend.onrender.com'
        : 'http://127.0.0.1:8000';
    return BASE_URL;
  };

  return {
    makeRequest,
    getBaseUrl,
  };
};

export default useApiClient;
