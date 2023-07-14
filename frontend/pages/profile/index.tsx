import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout';
import { authCheck } from "../../utils/auth";
import styled from 'styled-components';

const Profile = () => {
  const [user, setUser] = useState<any>(null);
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/llm_integration/user');
      const data = await response.json();
      setUser(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateEmail = async () => {
    try {
      const response = await fetch('/llm_integration/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: newEmail }),
      });
      const data = await response.json();
      setUser(data);
      setNewEmail('');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Layout isAuthenticated={authCheck()} title="Profile" isSplashPage={true}>
      <h1>My User</h1>

      {user && (
        <ProfileContainer>
          <h2>Profile Information</h2>
          <p>Name: {user.name}</p>
          <p>Email: {user.email}</p>

          <h2>Update Email</h2>
          <div>
            <input
              type="text"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
            <button onClick={handleUpdateEmail}>Update</button>
          </div>

          <h2>Current Plan</h2>
          <p>{user.plan}</p>
          <p>Usage: {user.usage}</p>

          <h2>Upgrade/Downgrade Plan</h2>
          <button>Upgrade</button>
          <button>Downgrade</button>
          <a href="https://buy.stripe.com/test_bIYg0NcLd5Iu3ok7ss">Buy a plan</a>
        </ProfileContainer>
      )}
    </Layout>
  );
};

const ProfileContainer = styled.div`
  h2 {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 30px;
  }
`;

export default Profile;
