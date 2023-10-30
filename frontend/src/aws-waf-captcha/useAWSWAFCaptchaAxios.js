import axios from 'axios'
import { getWAFEnv } from './util'

export function useAWSWAFCaptchaAxios (onCaptchaEvent = (event) => console.log(event)) {
  const captchaAxios = axios.create()
  function renderCaptcha () {
    document.body.style.cursor = 'wait'
    document.getElementById('modalOverlay').style.display = 'block'
    document.getElementById('modal').style.display = 'block'

    return new Promise((resolve) => {
      onCaptchaEvent('onCaptchaRequired')
      window.AwsWafCaptcha.renderCaptcha(document.getElementById('captchaForm'), {
        onSuccess: (wafToken) => {
          document.getElementById('modalOverlay').style.display = 'none'
          document.getElementById('modal').style.display = 'none'
          onCaptchaEvent('onSuccess')
          resolve(wafToken)
        },
        onLoad: () => {
          document.body.style.cursor = 'default'
          onCaptchaEvent('onLoad')
        },
        onError: () => onCaptchaEvent('onError'),
        onPuzzleTimeout: () => onCaptchaEvent('onPuzzleTimeout'),
        onPuzzleIncorrect: () => onCaptchaEvent('onPuzzleIncorrect'),
        onPuzzleCorrect: () => onCaptchaEvent('onPuzzleCorrect'),

        apiKey: getWAFEnv().CAPTCHA_API_KEY
      })
    })
  }

  const captchaRequired = (error) =>
    error.response.status === 405 && error.response.headers['x-amzn-waf-action'] === 'captcha'

  // Use an Axios interceptor to render the CAPTCHA if the WAF requires it
  captchaAxios.interceptors.response.use(response => response, (error) => {
    if (captchaRequired(error)) {
      return renderCaptcha().then(token => {
        // add the header x-aws-waf-token: token if doing cross domain requests
        return captchaAxios.request(error.config)
      })
    } else return Promise.reject(error)
  })

  // Ensure a token exists before making the request
  captchaAxios.interceptors.request.use(config => {
    return window.AwsWafIntegration.getToken().then((token) => {
      // add the header x-aws-waf-token: token if doing cross domain requests
      return config
    })
  }, _ => Promise.reject(_))

  return captchaAxios
}
