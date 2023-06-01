import axios, { AxiosRequestConfig } from 'axios';

var baseURL = '';
if (process.env.NODE_ENV === 'production') {
    baseURL = 'https://chat-real-estate-backend.onrender.com/';
}
else if (process.env.NODE_ENV === 'development') {
    baseURL = 'http://localhost:8000';
}



async function Api(method: 'GET' | 'POST' | 'PUT' | 'DELETE', endpoint: string, payload?: any, params?: any) {
    const password = process.env.REACT_APP_API_PASSWORD;
    const url = `${baseURL}/${endpoint}`;

    const headers = {
        Authorization: password,
    };


    const requestOptions: AxiosRequestConfig = {
        method,
        url,
        headers,
        data: payload,
        params: params
    };

    try {
        const response = await axios(requestOptions);
        console.log(`Webhook ${method} request sent successfully:`, response.data);
        return response
    } catch (error) {
        console.error(`Error sending webhook ${method} request`, error);
    }
}

export default Api