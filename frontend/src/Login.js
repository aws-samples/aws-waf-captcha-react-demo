import { useNavigate, Link } from 'react-router-dom'
import { React, useState } from 'react'
import { useAWSWAFCaptchaFetch } from './aws-waf-captcha'

// Login uses the browser native fetch and forces CAPTCHA completion with each request
export function Login () {
  const navigate = useNavigate()
  const captchaFetch = useAWSWAFCaptchaFetch()
  const [errorMessage, setErrorMessage] = useState('')

  function loginUser (event) {
    event.preventDefault()
    const username = event.target.inputUsername.value
    const password = event.target.inputPassword.value
    if (!username.trim().length || !password.trim().length) {
      setErrorMessage('Please enter a username and password')
      return
    } else setErrorMessage('')
    captchaFetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include'
    }).then(response => {
      navigate('/')
    })
  }

  return (
    <>
      <form onSubmit={loginUser} className="container">
        <div className="entry">
          <label>Username</label>
          <input type="text" id="inputUsername" placeholder="Enter username"/>
        </div>
        <div className="entry">
          <label>Password</label>
          <input type="password" id="inputPassword" placeholder="Password"/>
        </div>
        <div className="error">{errorMessage}</div>
        <div className="entry">
          <button className="button" type="submit">Login</button>
        </div>
        <div className="entry">
          <Link to={'/register'}>Register</Link>
        </div>
      </form>
    </>
  )
}
