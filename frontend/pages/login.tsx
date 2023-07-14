import React from 'react';
import Layout from '../components/layout';
import LoginComponent from '../components/loginForm';
import { authCheck } from '../utils/auth';
import styled from 'styled-components';


const LoginBox = styled.div`
display: flex;
flex-direction: column;
align-items: center;
justify-content: center;
  padding: 20px;
  border-radius: 4px;
  background-color: #fff;
  text-align: center;
`;

const LoginTitle = styled.h1`
  font-size: 24px;
  margin-bottom: 16px;
`;

const LoginWrapper = styled.div`
  margin-top: 16px;
`;

const LoginPage: React.FC = () => {
  return (
    <Layout
      isAuthenticated={authCheck()}
      userProfile=""
      isSplashPage={false}
    >
      <LoginBox>
        <LoginTitle>Sign In</LoginTitle>
        <LoginWrapper>
          <LoginComponent />
        </LoginWrapper>
      </LoginBox>
    </Layout>
  );
};

export default LoginPage;
