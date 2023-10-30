#!/usr/bin/env node

const cdk = require('aws-cdk-lib')
const { AWSWAFCaptchaReactStack } = require('../lib/aws-waf-captcha-react.js')

const app = new cdk.App()
new AWSWAFCaptchaReactStack(app, 'AWSWAFCaptchaReactStack', {
  env: { region: 'us-east-1' }
})
