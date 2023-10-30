import { React, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAWSWAFCaptchaAxios } from './aws-waf-captcha'

export function Todos () {
  const navigate = useNavigate()

  const [tasks, setTasks] = useState([])
  const [task, setTask] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [captchaEvents, setCaptchaEvents] = useState([])

  const captchaAxios = useAWSWAFCaptchaAxios((event) => {
    // Demonstrates how we can hook into the AWS WAF CAPTCHA events
    setCaptchaEvents(captchaEvents.push(event))
    console.log(captchaEvents)
  })

  useEffect(() => {
    fetchTasks()
  }, [])

  function fetchTasks () {
    fetch('/api/tasks', {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(response => {
      if (response.status === 401) {
        navigate('login')
      } else return response.json()
    }).then(setTasks)
  }

  function addTask (event) {
    event.preventDefault()
    const todo = event.target.task.value
    if (!todo.trim().length) {
      setErrorMessage('Please enter a todo')
      return
    } else setErrorMessage('')

    captchaAxios.post('/api/tasks', { title: todo }, {
      withCredentials: true,
      maxRedirects: 0,
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(_ => {
      setTask('')
      fetchTasks()
    })
  }

  function handleChange (event) {
    setTask(event.target.value)
  }

  return (
    <div className="container">
      <form onSubmit={addTask}>
        <div className="entry">
          <input
            onChange={handleChange}
            type="text"
            name="task"
            value={task}
          />
        </div>
        <div className="error">{errorMessage}</div>
        <div className="entry">
          <button className="button" type="submit">Add Todo</button>
        </div>
      </form>
      <ul>
        {tasks.map(item => <li key={item.id}>{item.title}</li>)}
      </ul>
    </div>
  )
}
