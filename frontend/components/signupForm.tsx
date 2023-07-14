import { useState } from 'react';
import useApiClient from '../helpers/api';
import logger from '../helpers/logger';
import { handleLogin } from '../utils/auth';
import Cookies from 'universal-cookie';
import { redirect } from '../utils/redirect';
import styled from 'styled-components';
import React from 'react';
import { Button, Input, Spacer } from '@nextui-org/react';

const cookies = new Cookies();

const SignupForm = () => {
  const [email, setEmail] = useState('');
  const [invitePWD, setInvitePWD] = useState('');

  const [password1, setPassword1] = useState('');
  const [password2, setPassword2] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const { makeRequest } = useApiClient();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (password1 !== password2) {
      window.alert('Enter the same password in both fields');
      return;
    }

    try {
      const response = await makeRequest('post', '/customers/register/', {
        email,
        password1,
        password2,
        username: name,
      });

      const access_token = response?.data?.access_token;
      const refresh_token = response?.data?.refresh_token;

      if (access_token && refresh_token) {
        await handleLogin(access_token, refresh_token);

        const whoAmIResponse = await makeRequest('GET', '/customers/who-am-i/');
        const customer_id = whoAmIResponse?.data?.customer_id;

        cookies.set('customer_id', customer_id);
        redirect('/dashboard');
      } else {
        logger.log('Signup failed.', email);
        setError('An error occurred during signup.');
      }
    } catch (error) {
      logger.log('Signup failed.', error);
      setError('An error occurred during signup.');
    }
  };

  const handleChangeInvite = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInvitePWD(event.target.value);
  };

  const handleChangeEmail = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  };

  const handleChangePassword1 = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword1(event.target.value);
  };

  const handleChangePassword2 = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword2(event.target.value);
  };

  const handleChangeName = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <SignupFormContainer>
        {/* <Input
          type="text"
          id="invite"
          name="invite"
          placeholder="Invite"
          value={invitePWD}
          onChange={handleChangeInvite}
        /> */}
        <Spacer y={0.5} />
        <Input
          type="text"
          id="name"
          name="name"
          placeholder="Name"
          value={name}
          onChange={handleChangeName}
        />
        <Spacer y={0.5} />
        <Input
          type="email"
          id="email"
          name="email"
          placeholder="Email"
          value={email}
          onChange={handleChangeEmail}
        />
        <Spacer y={0.5} />
        <Input
          type="password"
          id="password1"
          name="password1"
          placeholder="Password"
          value={password1}
          onChange={handleChangePassword1}
        />
        <Spacer y={0.5} />
        <Input
          type="password"
          id="password2"
          name="password2"
          placeholder="Confirm Password"
          value={password2}
          onChange={handleChangePassword2}
        />
        <Spacer y={0.5} />
        <Button type="submit">Sign Up</Button>
        <Error>
          {error && <p>{error}</p>}
        </Error>
      </SignupFormContainer>
    </form>

  );
};



const SignupFormContainer = styled.div`
display: flex;
flex-direction: column;
justify-content: center;
align-items: center;

`;


const Email = styled.div`
  background: url(../public/email.svg) no-repeat scroll 7px 6px;
  background-size: 20px 20px;
  background-position: 16px 14px;
  margin-bottom: 16px;

  `
const Name = styled.div`
background: url(../person.svg) no-repeat scroll 7px 6px;
background-size: 20px 20px;
background-position: 16px 14px;
margin-bottom: 16px;

`

const Password = styled.div`
background: url(/lock.svg) no-repeat scroll 7px 6px;
background-size: 20px 20px;
background-position: 16px 14px;
margin-bottom: 16px;


`

const Error = styled.div`

margin: 0.5rem 0 0;
display: none;
color: brown;
margin-top: 16px;

.show {
  display: block;

}`

export default SignupForm;
