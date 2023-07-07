import React from 'react';
import Layout from '../components/layout';
import SignupForm from '../components/signupForm';
import { authCheck } from '../utils/auth';


const Signup = () => {
  return (
    <Layout
      isAuthenticated={authCheck()}
      userProfile={""}
      title="Signup"
      isSplashPage="true"
    >
      <div className="page-signup center-center">
        <div className="box popover">
          <h1>Create account</h1>

          <SignupForm />
        </div>
      </div>
      <style jsx>{`
          .page-signup {
          }
        `}</style>
    </Layout>
  );
}

export default Signup;
