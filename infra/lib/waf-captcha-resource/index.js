const aws = require('aws-sdk')
const wafv2 = new aws.WAFV2({ region: 'us-east-1' })

exports.handler = async function (event) {
  const apikeys = await wafv2.listAPIKeys({ Scope: 'CLOUDFRONT' }).promise()
  var applicationIntegrationURL = apikeys.ApplicationIntegrationURL

  if (!applicationIntegrationURL.includes('captcha-sdk')) {
    applicationIntegrationURL = applicationIntegrationURL.replace(
      'sdk',
      'captcha-sdk'
    )
  }
  applicationIntegrationURL = applicationIntegrationURL + 'jsapi.js'

  var keyFound = false
  var selectedKey
  for (const key of apikeys.APIKeySummaries) {
    for (const domain of key.TokenDomains) {
      if (domain === event.ResourceProperties.Domain) {
        keyFound = true
        selectedKey = key.APIKey
      }
    }
  }

  if (!keyFound) {
    const response = await wafv2
      .createAPIKey({
        TokenDomains: [event.ResourceProperties.Domain],
        Scope: 'CLOUDFRONT'
      })
      .promise()
    selectedKey = response.APIKey
  }
  return {
    Data: {
      APIKey: selectedKey,
      CaptchaIntegrationURL: applicationIntegrationURL
    }
  }
}
