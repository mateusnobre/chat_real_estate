import { useState, ChangeEvent, FormEvent } from 'react';
import { handleLogin } from '../utils/auth';
import logger from '../helpers/logger';
import useApiClient from '../helpers/api';
import { redirect } from '../utils/redirect';
import styled from 'styled-components';
import React from 'react';
import { Button, Input, Loading, Spacer } from '@nextui-org/react';

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`
const Error = styled.div`

margin: 0.5rem 0 0;
display: none;
color: brown;
margin-top: 16px;

.show {
  display: block;

}

`



const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { makeRequest } = useApiClient();

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    if (name === 'email') {
      setEmail(value);
    } else if (name === 'password') {
      setPassword(value);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setIsLoading(true)
      const response = await makeRequest('POST', '/customers/login/', {
        email: email,
        password: password,
      });
      const access_token = response?.data?.access_token;
      const refresh_token = response?.data?.refresh_token;

      if (response && access_token && refresh_token) {
        await handleLogin(access_token, refresh_token);
        setIsLoading(false)
        redirect('/dashboard');
      } else {
        logger.log('Login failed.', email);
        setError('Invalid credentials.');
      }
    } catch (error) {
      console.error('You have an error in your code or there are network issues.', error);
      setError('An error occurred during login.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <LoginContainer>

        <Input
          className="icon-input new-section email"
          type="email"
          id="email"
          name="email"
          placeholder="Email"
          value={email}
          onChange={handleChange}
        />

        <Spacer y={0.5} />

        <Input
          className="icon-input password"
          type="password"
          id="password"
          name="password"
          placeholder="Password"
          value={password}
          onChange={handleChange}
        />
        <Spacer y={0.5} />

        {
          isLoading ?
            <Button disabled type="submit">
              <Loading type="points" color="currentColor" size="sm" />
            </Button>
            : <Button type="submit">
              <>Login </>
            </Button>
        }


        <Error>
          <p className={`error ${error && 'show'}`}>{error && `Error: ${error}`}</p>

        </Error>
      </LoginContainer>

    </form>
  );
};

export default LoginForm;
