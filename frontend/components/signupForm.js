import { useState } from 'react';
import useApiClient from '../helpers/api';
import logger from '../helpers/logger';
import { handleLogin } from '../utils/auth';
import Cookies from 'universal-cookie';
import { redirect } from '../utils/redirect.js';

const cookies = new Cookies();

const SignupForm = () => {
  const [email, setEmail] = useState('');
  const [invitePWD, setInvitePWD] = useState('');

  const [password1, setPassword1] = useState('');
  const [password2, setPassword2] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const { makeRequest } = useApiClient();

  const handleSubmit = async (event) => {
    event.preventDefault();
    // if (invitePWD != "FABIANO") {
    //   window.alert("Enter a valid invite")
    //   return

    // }
    if (password1 != password2) {
      window.alert("Enter the same password in both fields")
      return
    }
    try {
      const response = await makeRequest('post', '/customers/register/', {
        "email": email,
        "password1": password1,
        "password2": password2,
        "username": name,
      });
      const access_token = (response["data"]["access_token"])
      const refresh_token = (response["data"]["refresh_token"])

      await handleLogin(access_token, refresh_token);

      const whoAmIResponse = await makeRequest('GET', "/customers/who-am-i/");
      const customer_id = (whoAmIResponse["data"]["customer_id"])
      cookies.set('customer_id', customer_id);
      redirect('/dashboard');

    } catch (error) {
      logger.log('Signup failed.', error);
      setError('An error occurred during signup.');
    }
  };
  const handleChangeInvite = (event) => {
    setInvitePWD(event.target.value);
  };
  const handleChangeEmail = (event) => {
    setEmail(event.target.value);
  };

  const handleChangePassword1 = (event) => {
    setPassword1(event.target.value);
  };

  const handleChangePassword2 = (event) => {
    setPassword2(event.target.value);
  };

  const handleChangeName = (event) => {
    setName(event.target.value);
  };

  return (
    <>
      <div className="signup">
        <form onSubmit={handleSubmit}>
          {/* <input
            type="text"
            id="invite"
            name="invite"
            placeholder="Invite"
            value={invitePWD}
            onChange={handleChangeInvite}
          /> */}
          <input
            type="text"
            id="name"
            name="name"
            placeholder="Name"
            value={name}
            onChange={handleChangeName}
          />
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Email"
            value={email}
            onChange={handleChangeEmail}
          />
          <input
            type="password"
            id="password1"
            name="password1"
            placeholder="Password"
            value={password1}
            onChange={handleChangePassword1}
          />
          <input
            type="password"
            id="password2"
            name="password2"
            placeholder="Confirm your password"
            value={password2}
            onChange={handleChangePassword2}
          />

          <button type="submit">Sign Up</button>
        </form>
        {error && <p>{error}</p>}
      </div>
      <style jsx>{`
        .new-section {
          margin-top: 16px;
        }

        .email {
          background: url(../email.svg) no-repeat scroll 7px 6px;
          background-size: 20px 20px;
          background-position: 16px 14px;
        }

        .name {
          background: url(../person.svg) no-repeat scroll 7px 6px;
          background-size: 20px 20px;
          background-position: 16px 14px;
        }

        .password {
          background: url(../lock.svg) no-repeat scroll 7px 6px;
          background-size: 20px 20px;
          background-position: 16px 14px;
        }

        .error {
          margin: 0.5rem 0 0;
          color: brown;
        }
      `}</style>
    </>
  );
};

export default SignupForm;
