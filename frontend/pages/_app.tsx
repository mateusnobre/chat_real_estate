import React from 'react';
import RouteGuard from '../components/routeGuard';
import { NextUIProvider } from '@nextui-org/react';
interface GlobalAppProps {
  Component: React.ComponentType<any>;
  pageProps: any;
}

const GlobalApp: React.FC<GlobalAppProps> = ({ Component, pageProps }) => {
  let renderProps = { ...pageProps };

  return (
    <NextUIProvider>
      <RouteGuard>
        <Component {...renderProps} />
      </RouteGuard>
    </NextUIProvider>
  );
};

export default GlobalApp;
