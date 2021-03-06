import React from 'react';
import axios from 'axios';
import { Route, Switch, withRouter, NavLink } from 'react-router-dom';
import './css/index.css';
import { Account,
  Billing,
  CompanyLanding,
  CompanyDashboard,
  Dashboard,
  Job,
  JobList,
  Landing,
  Navigation,
  NoMatch,
  CompanyAccount
  } from './components';
import { Alert, Button} from 'antd';

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      loggedIn: false,
      error: null,
      message: null,
      token: null,
      jobs: null,
      employer: false,
      user: null
    }
  }

  componentDidMount() {
    const token = localStorage.getItem('token');
    if (token) {
      axios.post(`${process.env.REACT_APP_LOGIN_API}refresh/`, { token: token })
        .then(response => {
          this.logIn(response.data);
        })
        .catch(err => {
          if (err.message.includes('Network')) {
            // Does not log user out if Internet connection or server is down.
            this.setState({ error: `Problem connecting to server.`});
          } else {
            this.logOut(err, `Authentication expired. Please log in again.`);
          }
        });
    }
    else {
      let path = this.props.history.location.pathname;
      this.props.history.push('/');
      if (path !== '/' && path !== '/signin' && path !== '/company') {
        this.setState({ error: `Please log in or register.`});
      }
    }
  }

  logIn = (data, registerCompany) => {
    this.setState({ 
      loggedIn: true,
      error: null,
      message: null,
      token: data.token,
      employer: data.user.is_employer,
      user: data.user.id
    });
    localStorage.setItem('token', data.token);
    // Redirect based on user type
    if (registerCompany) {
      this.props.history.push('/account');
      this.setState({ message: `Please complete your company profile.`});
    } else if (data.user.is_employer) {
      this.props.history.push('/dashboard');
    } else {
      this.props.history.push('/jobs');
    }
  }

  checkToken = (e, appToken, localStorageToken) => {
    if (appToken !== localStorageToken) {
      this.logOut(e, `Problem authenticating account. Please log in again.`);
    }
  }

  logOut = (e, errorMessage, successMessage) => {
    localStorage.removeItem('token');
    this.setState({ 
      loggedIn: false,
      error: errorMessage,
      message: successMessage,
      token: null,
      jobs: null,
      employer: false,
      user: null
    });
    this.props.history.push('/signin');
  }

  setJobs = jobs => {
    this.setState({ jobs: jobs });
  }

  render() {
    const { loggedIn, error, message, token, jobs, employer, user } = this.state;
    let location = this.props.history.location.pathname;
    const home = location === '/';
    const company = location === '/company';
    const signin = location === '/signin';

    return (
      <div className="App">

        {error ? (
          <Alert message={error} type="error" closable showIcon banner />
          ) : (null)}
        {message ? (
          <Alert message={message} type="success" closable showIcon />
        ) : (null)}

        {loggedIn ? (
          <div className="nav-wrapper">
            <Navigation logOut={this.logOut} checkToken={this.checkToken} employer={employer} token={token} user={user}/>
          </div>
        ) : (
            // Navigation for unauthenticated users
            <div className="nav-wrapper">

              {home ? (
                <div className="home-navigation">
                  <div>
                    <h1>Open Jobs</h1>
                    <h3>No Degree, No Problem.<br/>Your next job is just a click away.</h3>
                    <div className="whitespace"></div>
                    <NavLink to='/company'><Button type="secondary">Post a Job</Button></NavLink>
                    <NavLink to='/signin'><Button type="primary">Sign In</Button></NavLink>
                  </div>
                </div>
              ) : (null)}

              {company ? (
                <div className="home-navigation">
                  <div>
                    <div className="whitespace"></div>
                    <NavLink to='/'><Button type="secondary">Job Seeker</Button></NavLink>
                    <NavLink to='/signin'><Button type="primary">Sign In</Button></NavLink>
                  </div>
                </div>
              ) : (null)}

              {signin ? (
                <div className="home-navigation">
                  <div>
                    <div className="whitespace"></div>
                    <NavLink to='/company'><Button type="secondary">Post a Job</Button></NavLink>
                  </div>
                </div>
              ) : (null)}

            </div>
        )}

        <div className="main">
          <Switch>
            {/* Landing Pages */}
            <Route exact path="/" render={() => <JobList jobs={jobs} setJobs={this.setJobs}/>} />
            <Route path="/signin" render={() => <Landing logIn={this.logIn}/>} />
            <Route path="/company" render={() => <CompanyLanding logIn={this.logIn}/>} />
            {/* Non-Auth Routes */}
            <Route exact path="/jobs" render={() => <JobList jobs={jobs} setJobs={this.setJobs}/>} />
            <Route path="/jobs/:id" render={() => <Job />} />
            {/* Auth Routes */}
            {employer ? (
              <Route path="/account" render={() => <CompanyAccount token={token} logOut={this.logOut} checkToken={this.checkToken} user={user}/>} />            
              ) : (
              <Route path="/account" render={() => <Account token={token} logIn={this.logIn} logOut={this.logOut} checkToken={this.checkToken} user={user}/>} />
            )}
            {employer ? (
              <Route exact path="/dashboard" render={() => <CompanyDashboard token={token} logOut={this.logOut}/>} />
            ) : (
              <Route exact path="/dashboard" render={() => <Dashboard token={token} logOut={this.logOut}/>} />
            )}
            <Route path="/billing" render={() => <Billing token={token} logOut={this.logOut}/>} />
            <Route component={NoMatch} />
          </Switch>
        </div>

      </div>
    );
  }
}

export default withRouter(App);