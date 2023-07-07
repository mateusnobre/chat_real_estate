import RouteGuard from '../components/routeGuard';

const GlobalApp = ({ Component, pageProps }) => {

  let renderProps = { ...pageProps };

  return <RouteGuard>
    <Component {...renderProps} />
  </RouteGuard>;
};

export default GlobalApp;
