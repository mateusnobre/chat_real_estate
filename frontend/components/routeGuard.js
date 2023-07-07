import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { authCheck } from '../utils/auth';


function RouteGuard({ children }) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // on initial load - run auth check 
        authCheckURL(router.asPath);

        // // on route change start - hide page content by setting authorized to false  
        // const hideContent = () => setIsAuthenticated(false);
        // router.events.on('routeChangeStart', hideContent);

        // // on route change complete - run auth check 
        // router.events.on('routeChangeComplete', authCheck)

        // // unsubscribe from events in useEffect return function
        // return () => {
        //     router.events.off('routeChangeStart', hideContent);
        //     router.events.off('routeChangeComplete', authCheck);
        // }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function authCheckURL(url) {
        // redirect to login page if accessing a private page and not logged in 
        const publicPaths = ['/login', "/", "/signup"];
        const path = url.split('?')[0];
        const isAuthenticated = authCheck()
        if (!isAuthenticated && !publicPaths.includes(path)) {
            setIsAuthenticated(false);
            router.push({
                pathname: '/login',
                // query: { returnUrl: router.asPath }
            });
        } else {
            setIsAuthenticated(true);
        }
    }

    return (isAuthenticated && children);
}

export default RouteGuard;
