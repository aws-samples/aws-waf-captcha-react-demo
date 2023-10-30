const { Stack } = require('aws-cdk-lib')

const cdk = require('aws-cdk-lib')
const waf = require('aws-cdk-lib/aws-wafv2')
const s3 = require('aws-cdk-lib/aws-s3')
const ec2 = require('aws-cdk-lib/aws-ec2')
const ecs = require('aws-cdk-lib/aws-ecs')
const ecsPatterns = require('aws-cdk-lib/aws-ecs-patterns')
const cloudfront = require('aws-cdk-lib/aws-cloudfront')
const origins = require('aws-cdk-lib/aws-cloudfront-origins')
const s3deploy = require('aws-cdk-lib/aws-s3-deployment')
const secretsmanager = require('aws-cdk-lib/aws-secretsmanager')
const path = require('path')

class AWSWAFCaptchaReactStack extends Stack {
  constructor (scope, id, props) {
    super(scope, id, props)

    // WAF rule to require Captcha for POST requests to the API
    const todoWebACL = new waf.CfnWebACL(this, 'TodoWebACL', {
      defaultAction: {
        allow: {}
      },
      captchaConfig: {
        immunityTimeProperty: {
          immunityTime: 60
        }
      },
      scope: 'CLOUDFRONT',
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: 'TodoWebACL',
        sampledRequestsEnabled: true
      },
      name: 'TodoWebACL',
      rules: [
        {
          name: 'POST-CAPTCHA',
          priority: 0,
          action: (waf.CfnWebACL.RuleActionProperty = { captcha: {} }),
          statement: {
            andStatement: {
              statements: [
                {
                  byteMatchStatement: {
                    searchString: '/api/',
                    fieldToMatch: {
                      uriPath: {}
                    },
                    textTransformations: [
                      {
                        priority: 0,
                        type: 'NONE'
                      }
                    ],
                    positionalConstraint: 'STARTS_WITH'
                  }
                },
                {
                  byteMatchStatement: {
                    searchString: 'POST',
                    fieldToMatch: {
                      method: {}
                    },
                    textTransformations: [
                      {
                        priority: 0,
                        type: 'NONE'
                      }
                    ],
                    positionalConstraint: 'EXACTLY'
                  }
                }
              ]
            }
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'TodoWebACLRule',
            sampledRequestsEnabled: true
          }
        }
      ]
    })

    // S3 Bucket for the React App
    const s3Bucket = new s3.Bucket(this, 'TodoSPA', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    })

    // ECS cluster for the backend app (note that docker container built from the backend directory)
    const vpc = new ec2.Vpc(this, 'TodoVPC', {
      maxAzs: 3
    })

    const cluster = new ecs.Cluster(this, 'TodoCluster', {
      vpc: vpc
    })

    const oai = new cloudfront.OriginAccessIdentity(this, 'todo-oai')
    s3Bucket.grantRead(oai)

    // Create a distribution with two behaviours, and attach the AWS WAF web ACL
    const cfDist = new cloudfront.Distribution(this, 'TodoDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(s3Bucket, { originAccessIdentity: oai })
      },
      defaultRootObject: 'index.html',
      webAclId: todoWebACL.attrArn
    })

    const cookieSecret = new secretsmanager.Secret(this, 'TodoCookieSecret', { generateSecretString: {} })

    const backendApp = new ecsPatterns.ApplicationLoadBalancedFargateService(
      this,
      'TodoFargateService',
      {
        cluster: cluster,
        cpu: 256,
        desiredCount: 1,
        taskImageOptions: {
          image: ecs.ContainerImage.fromAsset(
            path.join(__dirname, '../../backend')
          ),
          containerPort: 3000,
          secrets: {
            COOKIE_SECRET: ecs.Secret.fromSecretsManager(cookieSecret)
          },
          environment: {
            COOKIE_DOMAIN: cfDist.domainName
          }
        },
        memoryLimitMiB: 512,
        publicLoadBalancer: true
      }
    )

    cfDist.addBehavior(
      '/api/*',
      new origins.LoadBalancerV2Origin(backendApp.loadBalancer, {
        protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY
      }),
      {
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_AND_CLOUDFRONT_2022
      }
    )

    // Use a custom resource to get WAF CAPTCHA API details
    const serviceToken = cdk.CustomResourceProvider.getOrCreate(
      this,
      'Custom::WAFCaptchaResourceType',
      {
        codeDirectory: path.join(__dirname, 'waf-captcha-resource'),
        runtime: cdk.CustomResourceProviderRuntime.NODEJS_16_X,
        description: 'Lambda function created by the custom resource provider',
        policyStatements: [
          {
            Effect: 'Allow',
            Action: 'wafv2:CreateAPIKey',
            Resource: '*'
          },
          {
            Effect: 'Allow',
            Action: 'wafv2:ListAPIKeys',
            Resource: '*'
          }
        ]
      }
    )

    const wafCaptchaResource = new cdk.CustomResource(
      this,
      'WAFCaptchaResource',
      {
        resourceType: 'Custom::WAFCaptchaResourceType',
        serviceToken: serviceToken,
        properties: {
          Domain: cfDist.domainName
        }
      }
    )

    // Deploy frontend application
    new s3deploy.BucketDeployment(this, 'DeployTodoFrontend', {
      destinationBucket: s3Bucket,
      sources: [
        s3deploy.Source.asset(path.join(__dirname, '../../frontend'), {
          bundling: {
            image: cdk.DockerImage.fromBuild(
              path.join(__dirname, '../../frontend'),
              {}
            )
          }
        }),
        s3deploy.Source.jsonData('wafenv.json', {
          JSAPI_URL: wafCaptchaResource.getAtt('CaptchaIntegrationURL'),
          CAPTCHA_API_KEY: wafCaptchaResource.getAtt('APIKey')
        })
      ]
    })

    new cdk.CfnOutput(this, 'TodoEndpoint', {
      value: `https://${cfDist.domainName}`
    })
  }
}

module.exports = { AWSWAFCaptchaReactStack }
