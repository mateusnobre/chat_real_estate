import React from 'react';
import Link from 'next/link';
import Layout from '../components/layout';
import { authCheck } from "../utils/auth"

const Home = () => {
  const [isAuthenticatedValue, setIsAuthenticatedValue] = React.useState(false);

  React.useEffect(() => {
    setIsAuthenticatedValue(authCheck());
  }, [])
  return (
    <Layout
      isAuthenticated={isAuthenticatedValue}
      userProfile={"adas"}
      title="Chat-Real-Estate"
      isSplashPage="true"
    >
      <div className="home">
        <div className="container">
          <div className="text">
            <h1>Create your own personal AI Assistant. Take a leap in productivity!</h1>
            <h2>
              PDFs, epub, Word Files, Youtube URLs with Captions, Web Pages, and many more accepted file types.
            </h2>
            <Link href="/login">
              <a className="btn btn-primary">Try it out!</a>
            </Link>
          </div>
        </div>
      </div>
      <style jsx>{`
          .home {
            display: flex;
            height: 100%;
            align-items: center;
            padding-bottom: 30%;
          }

          h1 {
            font-size: 40px;
            font-weight: 600;
            color: #fff;
            width: 70%;
            margin-bottom: 30px;
          }

          h2 {
            font-size: 20px;
            font-weight: 600;
            color: #fff;
            width: 60%;
            margin-bottom: 30px;
          }

          .text {
            padding: 20px;
            position: relative;
            width: 100%;
            border: 0;
          }
        `}</style>
    </Layout>
  );
}

export default Home;
