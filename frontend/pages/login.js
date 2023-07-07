import React from 'react';
import Layout from '../components/layout';
import SaltoBanner from '../components/saltoBanner';
import LoginComponent from '../components/loginForm';
import { authCheck } from '../utils/auth';

const LoginPage = () => {
  return (
    <Layout
      isAuthenticated={authCheck()}
      userProfile={""}
      isSplashPage="true"
    >
      <div className="login-page center-center">
        <div className="container">
          <div className="box popover">
            <h1>Sign in</h1>
            <LoginComponent />
          </div>
        </div>

        <SaltoBanner />
      </div>
      <style jsx>{`
          .login-page {
          }
        `}</style>
    </Layout>
  );
}

export default LoginPage;
