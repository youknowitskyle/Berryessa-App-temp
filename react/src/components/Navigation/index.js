import React from "react";
import { Link } from "react-router-dom";

import SignOutButton from "../SignOut";
import * as ROUTES from "../../constants/routes";
import * as ROLES from "../../constants/roles";

import { AuthUserContext } from "../Session";

import Menu from "../../img/menu.png";
import Popup from "reactjs-popup";

import "./styles.css";

class Navigation extends React.Component {
  constructor(props) {
    super(props);

    this.state = { openMenu: false };
  }

  render() {
    return (
      <div>
        <Popup
          trigger={open => {
            return (
              //add rotate on click
              <img src={Menu} alt="navigation-menu" width="40" height="40" />
            );
          }}
          position="right top"
          closeOnDocumentClick
        >
          <AuthUserContext.Consumer>
            {authUser =>
              authUser ? (
                <NavigationAuth authUser={authUser} />
              ) : (
                <NavigationNonAuth />
              )
            }
          </AuthUserContext.Consumer>
        </Popup>
        <span className="sign-out">
          <AuthUserContext.Consumer>
            {authUser => {
              return authUser && <SignOutButton />;
            }}
          </AuthUserContext.Consumer>
        </span>
      </div>
    );
  }
}

const NavigationAuth = ({ authUser }) => (
  <ul>
    <li>
      <Link to={ROUTES.LANDING}>Landing</Link>
    </li>
    <li>
      <Link to={ROUTES.HOME}>Home</Link>
    </li>
    <li>
      <Link to={ROUTES.ACCOUNT}>Account</Link>
    </li>
    {!!authUser.roles[ROLES.ADMIN] && (
      <li>
        <Link to={ROUTES.ADMIN}>Admin</Link>
      </li>
    )}
    {(!!authUser.roles[ROLES.ADMIN] || !!authUser.roles[ROLES.MODERATOR]) && (
      <li>
        <Link to={ROUTES.MODERATOR}>Moderator</Link>
      </li>
    )}
    <li>
      <Link to={ROUTES.PRAYER}>Prayer Requests</Link>
    </li>
    <li>
      <Link to={ROUTES.CALENDAR}>Calendar</Link>
    </li>
  </ul>
);

const NavigationNonAuth = () => (
  <ul>
    <li>
      <Link to={ROUTES.LANDING}>Landing</Link>
    </li>
    <li>
      <Link to={ROUTES.SIGN_IN}>Sign In</Link>
    </li>
  </ul>
);

export default Navigation;
