import { useNavigate } from 'react-router-dom'
import { React, useState } from 'react'
import { useAWSWAFCaptchaFetch } from './aws-waf-captcha'

export function Register () {
  const navigate = useNavigate()
  const [errorMessage, setErrorMessage] = useState('')
  const captchaFetch = useAWSWAFCaptchaFetch()

  function registerUser (event) {
    event.preventDefault()
    const username = event.target.inputUsername.value
    const password = event.target.inputPassword.value
    if (!username.trim().length || !password.trim().length) {
      setErrorMessage('Please enter a username and password')
      return
    } else setErrorMessage('')
    captchaFetch('/api/signup', {
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
      <form onSubmit={registerUser} className="container">
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
          <button className="button" type="submit">Register</button>
        </div>
      </form>
    </>
  )
}
