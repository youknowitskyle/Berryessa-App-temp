import React from "react";
import { compose } from "recompose";

import { withAuthorization } from "../Session";
import { withFirebase } from "../Firebase";

const PrayerPage = () => (
  <div>
    <h1>Prayer Requests</h1>
    <p>If you need prayer for anything, please submit your request below.</p>
    <PrayerForm />
  </div>
);

const INITIAL_STATE = {
  request: "",
  error: null
};

class PrayerForm extends Component {
  constructor(props) {
    super(props);

    this.state = { ...INITIAL_STATE };
  }

  onSubmit = event => {
    const { request } = this.state;

    this.props.firebase
      .doSignInWithEmailAndPassword(email, password)
      .then(() => {
        this.setState({ ...INITIAL_STATE });
        this.props.history.push(ROUTES.HOME);
      })
      .catch(error => {
        this.setState({ error });
      });

    event.preventDefault();
  };

  onChange = event => {
    this.setState({ [event.target.name]: event.target.value });
  };

  render() {
    const { email, password, error } = this.state;

    const isInvalid = password === "" || email === "";

    return (
      <form onSubmit={this.onSubmit}>
        <input
          name="email"
          value={email}
          onChange={this.onChange}
          type="text"
          placeholder="Email Address"
        />
        <input
          name="password"
          value={password}
          onChange={this.onChange}
          type="password"
          placeholder="Password"
        />
        <button disabled={isInvalid} type="submit">
          Sign In
        </button>

        {error && <p class="text-danger">{error.message}</p>}
      </form>
    );
  }
}

const condition = authUser => !!authUser;

//or equivalently:
//const condition = authUser => authUser != null;

export default withAuthorization(condition)(PrayerPage);
