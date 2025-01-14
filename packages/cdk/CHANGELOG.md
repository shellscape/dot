# @dot/cdk ChangeLog

## v3.20.2

_2025-01-14_

### Bugfixes

- cdk: use nanoid for unique ids for grantRemote (f6fce8b)

## v3.20.1

_2025-01-14_

### Bugfixes

- cdk: use unique ids for grantRemote (e03ef4d)

## v3.20.0

_2025-01-08_

### Features

- cdk: add getRemoteSecretValue (db91058)

## v3.19.2

_2025-01-08_

### Bugfixes

- cdk: allow buckets to enable ACLs (00f8d1a)

## v3.19.1

_2025-01-08_

### Updates

- cdk: update aws-cdk-lib (acc682e)

## v3.19.0

_2025-01-07_

### Features

- cdk: add amplify, monitoring, signing methods (550aa9a)

## v3.18.1

_2024-10-21_

### Updates

- cdk: update dependencies (0798046)

## v3.18.0

_2024-08-23_

### Features

- cdk: allow setting bucket versioning (e15e351)

## v3.17.2

_2024-08-23_

### Updates

- cdk: expand permissions for s3 backups (88d0a88)

## v3.17.1

_2024-08-23_

### Updates

- cdk: disable default policy for s3 bucket backups (1dd2f3e)

## v3.17.0

_2024-06-15_

### Features

- cdk: allow setting port, command, and container registry (5dc7de3)

## v3.16.0

_2024-06-09_

### Features

- cdk: expose runtime config for fargate (955210f)

## v3.15.1

_2024-06-09_

### Bugfixes

- cdk: roll back jsonValue (b9ad00d)

## v3.15.0

_2024-06-09_

### Features

- cdk: allow setting secret values (8c23bae)

## v3.14.9

_2024-05-15_

### Bugfixes

- access,cdk,config,env,versioner: bump log dependency (196025e)

## v3.14.8

_2024-04-15_

### Bugfixes

- cdk: mitigate long backup names when creating backup+vault (2f26d6f)

## v3.14.7

_2024-04-03_

### Bugfixes

- cdk: proxy catch all should not use paths (b486d51)

## v3.14.6

_2024-03-11_

### Bugfixes

- cdk: add s3 readonly to bucket backup (f5d39a7)

## v3.14.5

_2024-03-07_

### Bugfixes

- cdk: default vpc endpoints and bucket name for grant (b10b367)

## v3.14.4

_2024-03-06_

### Bugfixes

- cdk: refinements for fargate deploys (bd85fe9)

## v3.14.3

_2024-03-06_

### Bugfixes

- cdk: more removal policy refinement for s3 (d5d0f3f)

## v3.14.2

_2024-03-06_

### Bugfixes

- cdk: override backup role name (9e3e4f7)

## v3.14.0

_2024-03-06_

### Features

- cdk: refine dynamo retention settings (d97f3fe)

## v3.13.1

_2024-03-06_

### Bugfixes

- cdk: add specialized permissions for s3 backups (7439918)

## v3.13.0

_2024-03-06_

### Features

- cdk: refine bucket auto delete and retention (7cbded7)

## v3.12.0

_2024-03-05_

### Features

- cdk: timeToLiveAttribute for dynamo tables (b343307)

## v3.11.1

_2024-02-29_

### Bugfixes

- cdk: allow binaryMedia to be served by RestApi (eea3e72)

## v3.11.0

_2024-02-28_

### Features

- cdk: use node v18 as default for lambda (ab0b28a)

## v3.10.1

_2024-02-28_

### Bugfixes

- cdk: add rule name to new rule (8a1f686)

## v3.10.0

_2024-01-23_

### Features

- cdk: enable circuit breaker support for fargate (6a9c5bf)

## v3.9.4

_2024-01-11_

### Bugfixes

- cdk: update dependencies (11a6c51)

## v3.9.3

_2023-11-10_

### Bugfixes

- fix: don't set IS_FARGATE for lambdas (70ff3b0)

## v3.9.2

_2023-09-29_

### Bugfixes

- fix: add timestamp to IDs for eventbus and queue (ca4e6cb)

## v3.9.1

_2023-09-13_

### Updates

- chore: update dependencies (612065c)

## v3.9.0

_2023-09-13_

### Features

- feat: addBus, addRule (f3890f4)

## v3.8.1

_2023-07-16_

### Bugfixes

- fix: disable circuit breaker due to set service name use (389efdb)

## v3.8.0

_2023-07-16_

### Features

- feat: use circuit braker for fargate, update deps (aae7049)

## v0.1.3

_2023-01-24_

### Bugfixes

- fix: fix chalk curly boundary (6763463e)

## v0.1.2

_2023-01-24_

Bumps @dot/env dependency

## v0.1.1

_2023-01-24_

## Bugfixes

- Fixes an errant @dot/env version in the v0.1.0 package.json

## v0.1.0

_2023-01-24_

Initial Release
