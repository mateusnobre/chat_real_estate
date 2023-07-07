import { useState } from 'react';
import { handleLogin } from '../utils/auth';
import logger from '../helpers/logger';
import useApiClient from '../helpers/api';
import Cookies from 'universal-cookie';
import { redirect } from '../utils/redirect.js';

const cookies = new Cookies();

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const { makeRequest } = useApiClient();

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === 'email') {
      setEmail(value);
    } else if (name === 'password') {
      setPassword(value);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await makeRequest('POST', "/customers/login/", { email: email, password: password });
      const access_token = (response["data"]["access_token"])
      const refresh_token = (response["data"]["refresh_token"])

      if (response && access_token && refresh_token) {
        await handleLogin(access_token, refresh_token);

        const whoAmIResponse = await makeRequest('GET', "/customers/who-am-i/");
        const customer_id = (whoAmIResponse["data"]["customer_id"])
        cookies.set('customer_id', customer_id);
        redirect('/dashboard');
      } else {
        logger.log('Login failed.');
        setError('Invalid credentials.');
      }
    } catch (error) {
      console.error('You have an error in your code or there are network issues.', error);
      setError('An error occurred during login.');
    }

  };

  return (
    <>
      <div className="login">
        <form onSubmit={handleSubmit}>
          <input
            className="icon-input new-section email"
            type="email"
            id="email"
            name="email"
            placeholder="Email"
            value={email}
            onChange={handleChange}
          />
          <input
            className="icon-input password"
            type="password"
            id="password"
            name="password"
            placeholder="Password"
            value={password}
            onChange={handleChange}
          />

          <button type="submit" className="btn btn-primary btn-full">
            Sign in
          </button>

          <p className={`error ${error && 'show'}`}>{error && `Error: ${error}`}</p>
        </form>
      </div>
      <style jsx>{`
    .new-section {
      margin-top: 16px;
    }

    .email {
      background: url(/email.svg) no-repeat scroll 7px 6px;
      background-size: 20px 20px;
      background-position: 16px 14px;
    }

    .password {
      background: url(/lock.svg) no-repeat scroll 7px 6px;
      background-size: 20px 20px;
      background-position: 16px 14px;
    }

    .error {
      margin: 0.5rem 0 0;
      display: none;
      color: brown;
    }

    .error.show {
      display: block;
    }
  `}</style>
    </>

  );
};

export default LoginForm;