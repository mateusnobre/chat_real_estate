import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { authCheck } from '../utils/auth';

interface RouteGuardProps {
    children: ReactNode;
}

function RouteGuard({ children }: RouteGuardProps) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // on initial load - run auth check
        authCheckURL(router.asPath);

        // on route change start - hide page content by setting authorized to false
        const hideContent = () => setIsAuthenticated(false);
        router.events.on('routeChangeStart', hideContent);

        // on route change complete - run auth check
        router.events.on('routeChangeComplete', authCheckURL);

        // unsubscribe from events in useEffect return function
        return () => {
            router.events.off('routeChangeStart', hideContent);
            router.events.off('routeChangeComplete', authCheckURL);
        };
    }, [router]);

    function authCheckURL(url: string) {
        // redirect to login page if accessing a private page and not logged in
        const publicPaths = ['/login', '/', '/signup'];
        const path = url.split('?')[0];
        const isAuthenticated = authCheck();
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
    if (isAuthenticated === true)  {
        return children;
    }
    else {
        return null
    }
}

export default RouteGuard;
