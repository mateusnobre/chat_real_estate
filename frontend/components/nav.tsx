import React from 'react';
import Link from 'next/link';
import NavProfile from './navProfile';
import styled from 'styled-components';

interface NavProps {
  isDashboard?: boolean;
  isAuthenticated: boolean;
  isSplashPage: boolean;
  userProfile?: any; // Replace 'any' with the actual type of userProfile
}

const Navigation = styled.nav`

display: flex;
align-content: center;
width:100%;
justify-content: space-between;
flex-direction: row;
align-items: center;
flex-wrap: wrap;
top: 0;
left: 0;
right: 0;
z-index: 999;
box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
transition: all 0.3s ease-in-out;
transform: translateY(0);
&.is-scrolling {
  transform: translateY(-100px);
}
margin: 0 0 32px 0;
padding: 20px;
height: 45px;
color: #ffffff;
`;

const Logo = styled.img`

  align-self: center;
  width: 50px;
  height: 50px;

`

class Nav extends React.Component<NavProps> {
  constructor(props: NavProps) {
    super(props);
  }

  render() {
    const { isDashboard } = this.props;
    let logoSrc = '/logo.png';
    let navClass = 'navbar navbar-fixed navbar-expand-lg';

    if (isDashboard) {
      logoSrc = '/logo_dark.png';
      navClass += ' navbar-light';
    } else {
      navClass += ' navbar-dark';
    }

    return (
      <Navigation>
        <Link href="/">
          <a className="navbar-brand" style={{ color: '#2596be', fontWeight: "bold", fontSize: "25px" }}>
            ChatRealEstate
            {/* <Logo className="logo" src={logoSrc} /> */}
          </a>
        </Link>

        <NavProfile
          isAuthenticated={this.props.isAuthenticated}
          userProfile={this.props.userProfile}
          isSplashPage={this.props.isSplashPage}
        />
      </Navigation>
    );
  }
}

export default Nav;
