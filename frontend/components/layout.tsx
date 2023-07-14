import React, { ReactNode } from 'react';
import Head from './head';
import Nav from './nav';
import NProgress from './nprogress';
import styled from 'styled-components';

interface LayoutProps {
  title?: string;
  isAuthenticated: boolean;
  isDashboard?: boolean;
  isSplashPage: boolean;
  userProfile?: any; // Replace 'any' with the actual type of userProfile
  width?: string;
  children: ReactNode;
}

const Container = styled.div`
  height: 100%;
  width: 100%;
display:flex;
flex-direction:column;
  align-items: center;
  justigy-content:center;
`;

const App = styled.div < { isSlashPage: boolean } > `
  overflow: hidden;
  
  ${(props) =>
    `
        width: 100%;
        height: 100vh;
        
        position: relative;
        object-fit: cover;
        vertical-align: bottom;

        background: ${props.isSlashPage ? 'transparent' : 'linear-gradient(0deg, rgba(255, 255, 255, 0) 15%, #000000 100%), url(background.jpg) no-repeat'};
        background-size: cover;
        background-position: center center;
      `}
`;

const Layout: React.FC<LayoutProps> = (props) => (
  <>
    <Head title={props.title || 'Home'} />
    <NProgress />
    <App isSlashPage={props.isSplashPage}>
      <Nav
        isAuthenticated={props.isAuthenticated}
        isDashboard={props.isDashboard}
        userProfile={props.userProfile}
        isSplashPage={props.isSplashPage}
      />

      <Container className={props.width === 'full' ? 'container-fluid' : 'container content-wrapper'}>
        {props.children}
      </Container>
    </App>

    <style jsx>{`
      :global(body) {
        font-family: -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, sans-serif;
        line-height: 1.75em !important;
        color: #484848 !important;
        font-size: 16px;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
    `}</style>
  </>
);

export default Layout;
