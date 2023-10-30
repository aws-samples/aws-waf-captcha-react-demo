// Load WAF environment at start
export async function loadWAFEnv (envFile = './wafenv.json') {
  window.AWS_WAF_ENV = await fetch(envFile)
    .then(response => response.json())
}

export function getWAFEnv () {
  return window.AWS_WAF_ENV
}

// Loads the AWS WAF JS API Script dynamically
export function loadScript () {
  if (document.getElementById('AwsWAFScript')) return

  const AwsWafScript = document.createElement('script')
  AwsWafScript.id = 'AwsWAFScript'
  AwsWafScript.async = false
  AwsWafScript.src = getWAFEnv().JSAPI_URL
  document.head.appendChild(AwsWafScript)
}
