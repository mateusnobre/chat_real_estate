import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../components/layout';
import { authCheck } from '../utils/auth';
import styled from 'styled-components';
import { Spacer } from '@nextui-org/react';

const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-bottom: 30%;
  justify-content: center;
  @media (max-width: 600px) {
    justify-content: flex-start;
    align-items: center;
  }
`;

const HomeTitle = styled.h1`
  font-size: 40px;
  font-weight: 600;
  color: #fff;
  width: 70%;
  margin-bottom: 30px;
  @media (max-width: 600px) {
    text-align: center;
    font-size: 30px;
  }
`;

const HomeSubtitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  width: 60%;
  margin-bottom: 30px;
`;

const HomeButton = styled.a`
  background-color: #007bff;
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
  text-decoration: none;
  font-weight: bold;
  transition: background-color 0.3s ease;
  width: 110px;
  &:hover {
    background-color: #0056b3;
  }
`;

const Home: React.FC = () => {
  const [isAuthenticatedValue, setIsAuthenticatedValue] = useState(false);

  useEffect(() => {
    setIsAuthenticatedValue(authCheck());
  }, []);

  return (
    <Layout
      isAuthenticated={isAuthenticatedValue}
      userProfile="adas"
      title="ChatRealEstate"
      isSplashPage={false}
    >
      <HomeContainer>
        <HomeTitle>Personal AI Assistant based on Real Estate Data</HomeTitle>
        {window.innerWidth > 600 ?
          <>
            <HomeSubtitle>
              PDFs, epub, Word Files, Youtube URLs with Captions, Web Pages, and many more accepted file types.
            </HomeSubtitle>
            <Link href="/login">
              <HomeButton><a>Try it out!</a></HomeButton>
            </Link>
          </> :
          <>
            <Link href="/login">
              <div style={{ userSelect: "none", cursor: "pointer", touchAction: "manipulation", height: '33px', width: '130px', alignContent: "center", borderRadius: "10px", textAlign: 'center', fontSize: "15px", border: "2px solid white", backgroundColor: 'transparent', color: 'white' }}>Sign In</div>
            </Link>
            <Spacer y={0.5} />
            <Link href="/signup">
              <div style={{ userSelect: "none", cursor: "pointer", touchAction: "manipulation", height: '33px', width: '130px', alignContent: "center", borderRadius: "10px", textAlign: 'center', fontSize: "15px", backgroundColor: '#fff', color: '#000' }}>Create Account</div>
            </Link>
          </>
        }
      </HomeContainer>
    </Layout >
  );
};

export default Home;
