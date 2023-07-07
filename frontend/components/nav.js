import React from 'react';
import Link from 'next/link';
import NavProfile from './navProfile';

class Nav extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    let logoSrc = '/logo.png';
    let navClass = 'navbar navbar-fixed navbar-expand-lg';

    if (this.props.isDashboard) {
      logoSrc = '/logo_dark.png';

      navClass += ' navbar-dark';
    } else {
      navClass += ' navbar-light';
    }

    return (
      <div className="navigation container">
        <nav className={navClass}>
          <ul className="navbar-nav mr-auto">
            <li className="navitem d-flex">
              <Link href="/">
                <a className="navbar-brand">
                  Chat Real Estate
                </a>
              </Link>
            </li>
          </ul>

          <NavProfile
            isAuthenticated={this.props.isAuthenticated}
            userProfile={this.props.userProfile}
          />

          <style jsx>{`
            .navbar {
              margin: 32px 0 32px 0;
              padding: 0;
              height: 45px;
              color: #fff;
            }

            .navbar-brand {
              display: flex;
              align-content: center;
            }

            .logo {
              align-self: center;
              width: 50px;
              height: 50px;
            }
          `}</style>
        </nav>
      </div>
    );
  }
}
export default Nav;
