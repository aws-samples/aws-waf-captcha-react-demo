import { getWAFEnv } from './util'

// Intercepts fetch requests and forces CAPTCHA completion with a modal popup before every fetch.
export function useAWSWAFCaptchaFetch () {
  function captchaFetch (input, init) {
    document.body.style.cursor = 'wait'
    document.getElementById('modalOverlay').style.display = 'block'
    document.getElementById('modal').style.display = 'block'

    return new Promise((resolve) => {
      window.AwsWafCaptcha.renderCaptcha(document.getElementById('captchaForm'), {
        onSuccess: () => {
          document.getElementById('modalOverlay').style.display = 'none'
          document.getElementById('modal').style.display = 'none'
          resolve(window.AwsWafIntegration.fetch(input, init))
        },
        onLoad: () => {
          document.body.style.cursor = 'default'
        },
        apiKey: getWAFEnv().CAPTCHA_API_KEY
      })
    })
  }

  return captchaFetch
}
