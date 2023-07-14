import React from 'react';
import Layout from '../components/layout';
import SignupForm from '../components/signupForm';
import { authCheck } from '../utils/auth';
import styled from 'styled-components';

const SignupPageContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;

`;

const SignupBox = styled.div`
  padding: 20px;
  border-radius: 4px;
  background-color: #fff;
`;

const SignupTitle = styled.h1`
  font-size: 24px;
  margin-bottom: 16px;
`;

const SignupWrapper = styled.div`
  margin-top: 16px;
`;

const Signup: React.FC = () => {
  return (
    <Layout
      isAuthenticated={authCheck()}
      userProfile=""
      title="Signup"
      isSplashPage={false}
    >
      <SignupPageContainer>
        <SignupBox>
          <SignupTitle>Create Account</SignupTitle>
          <SignupWrapper>
            <SignupForm />
          </SignupWrapper>
        </SignupBox>
      </SignupPageContainer>
    </Layout>
  );
};

export default Signup;
