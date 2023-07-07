import React from 'react';
import Link from 'next/link';
import { logout } from '../utils/auth';
import useApiClient from '../helpers/api';
import Cookies from 'universal-cookie';

const cookies = new Cookies();

const NavProfile = ({ isAuthenticated, userProfile }) => {
  const apiClient = useApiClient();

  const handleLogout = async () => {
    const refresh_token = cookies.get('refresh_token');
    const response = await apiClient.makeRequest('POST', "/customers/logout/", {
      refresh_token
    });
    logout();
  };

  let items;
  if (isAuthenticated) {
    items = (
      <>
        <li className="navitem d-flex">
          <Link href="/dashboard">
            <a className="dropdown-item">Dashboard</a>
          </Link>
        </li>
        <li className="nav-item">
          <Link href="/my_indexes">
            <a className="dropdown-item">My Agents</a>
          </Link>
        </li>
        <li className="nav-item">
          <a className="dropdown-item" href="#" onClick={handleLogout}>
            Log out
          </a>
        </li>


      </>
    );
  } else {
    items = (
      <>
        <li className="navitem d-flex">
          <Link href="/signup">
            <a className="btn">Create account</a>
          </Link>
        </li>
        <li className="nav-item">
          <Link href="/login">
            <a className="btn">Sign in</a>
          </Link>
        </li>
      </>
    );
  }

  return (
    <ul className="navbar-nav flex-row">
      {items}
      <style jsx>{`
        :global(.avatar) {
          width: 44px;
          object-fit: cover;
          height: 44px;
          margin-right: 4px;
        }

        :global(.dropdown-menu) {
          position: absolute !important;
          z-index: 10000;
        }
      `}</style>
    </ul>
  );
};

export default NavProfile;
