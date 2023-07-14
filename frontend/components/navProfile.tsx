import React from 'react';
import Link from 'next/link';
import { logout } from '../utils/auth';
import useApiClient from '../helpers/api';
import Cookies from 'universal-cookie';
import styled from 'styled-components';
import { Button, Dropdown } from "@nextui-org/react";

const cookies = new Cookies();

const Items = styled.div< { isSplashPage: boolean } >`

display:flex;
flex-direction:row;
justify-content:center;
align-items:center;

`;

interface NavProfileProps {
  isAuthenticated: boolean;
  isSplashPage: boolean;
  userProfile: any; // Replace 'any' with the actual type of userProfile
}

const NavProfile: React.FC<NavProfileProps> = ({ isAuthenticated, userProfile, isSplashPage }) => {
  const apiClient = useApiClient();

  const handleLogout = async () => {
    const refresh_token = cookies.get('refresh_token');
    const response = await apiClient.makeRequest('POST', '/customers/logout/', {
      refresh_token,
    });
    logout();
  };

  let items;
  if (isAuthenticated) {
    items = (
      <Dropdown>
        <Dropdown.Button flat>Menu</Dropdown.Button>
        <Dropdown.Menu aria-label="Static Actions">
          <Dropdown.Item key="new">
            <Link href="/dashboard">
              <div style={{ width: '100%' }}>Ask with Data</div>
            </Link></Dropdown.Item>
          <Dropdown.Item key="copy">
            <Link href="/profile">
              <div style={{ width: '100%' }}>Your Profile</div>
            </Link>
          </Dropdown.Item>
          <Dropdown.Item key="edit">
            <Link href="/my_indexes">
              <div style={{ width: '100%' }}>My Data Sources</div>
            </Link></Dropdown.Item>
          <Dropdown.Item key="delete" color="error">
            <div style={{ width: '100%' }} href="#" onClick={handleLogout}>
              Log out
            </div>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    );
  } else {
    if (window.innerWidth > 600) {
      items = (
        <Items isSplashPage={isSplashPage}>
          <Link href="/login">
            <div style={{ height: '33px', width: '130px', alignContent: "center", borderRadius: "10px", textAlign: 'center', fontSize: "15px", border: "2px solid white", marginRight: "5px", backgroundColor: 'transparent', color: 'white' }}>Sign In</div>
          </Link>
          <Link href="/signup">
            <div style={{ height: '33px', width: '130px', alignContent: "center", borderRadius: "10px", textAlign: 'center', fontSize: "15px", backgroundColor: '#fff', marginLeft: "5px", color: '#000' }}>Create Account</div>

          </Link>

        </Items >
      );
    }
    else {
      items = (
        <Items isSplashPage={isSplashPage} />
      )
    }
  }

  return items;
};

export default NavProfile;
