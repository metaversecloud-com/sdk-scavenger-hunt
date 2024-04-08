# The opinionated Topia Boilerplate

# Getting Started

This boilerplate is meant to give you a simple starting point to build new features in Topia using our Javascript SDK.

# NOTES

- This repository uses (NPM Workspaces)[https://docs.npmjs.com/cli/v7/using-npm/workspaces]
- We use Typescript
- Express for Server app
- Vite based React client app

## Implementation Notes

- This application leverages `sceneDropId` to manage dropped assets and defaults to "ScavengerHunt" if one is not found.
- The key asset should always have the unique name "ScavengerHunt" regardless of how many instances are placed in world.
- If the instance of the application should allow users to drop a leaf upon completion then an asset with the unique name "ScavengerHuntBuildableAsset" must be included in the scene.

## Initial Setup

### Install

Run `npm install` or `yarn install` on the root directory.

Notes:

1. Root package.json is for general/shared dependencies.
2. Client and Server package.json files are for app specific dependencies.
3. We DO want to keep the ts-config files seperate, given that we might have different needs for client and server.

### Run in Docker

1. For local development run `docker-compose up`. This runs the client(3001) and server(3000) on seperate ports. You can access them seperately. They are also setup with auto-build on save.
2. To build an image for delivery run `docker build . -t [add a name]:v[version_number]`. This will generate an image that you can push out to ECR for deployment.

## Add your .env environmental variables

For the server you need to setup environment variables. Copy the `.env-exmaple` file and rename it `.env`.

```json
API_URL=http://localhost:3001
INSTANCE_DOMAIN=api.topia.io
PUBLIC_KEY=yourkey
PRIVATE_KEY=enteryoursecret
```

**Developer Note: DO NOT use API_KEY unless absolutely necessary. ASK IN SLACK BEFORE USING**

[Topia Dev Account Dashboard](https://dev.topia.io/t/dashboard/integrations)
[Topia Production Account Dashboard](https://topia.io/t/dashboard/integrations)

Example of what to put inside of each droppedAsset dataObject

```json
{
  "challenge": {
    "imgUrl": "IMG_Start.png",
    "answer": "yes",
    "text": "Did the challenge finish?"
  },
  "theme": "robot",
  "clues": [
    {
      "contentImgUrl": "https://assets-global.website-files.com/6536cb67a381b2b8c0317b9a/65546505c732cb3fd47036ad_download%2520(15)-p-800.png",
      "text": "Clue 1"
    },
    {
      "contentImgUrl": "https://assets-global.website-files.com/6536cb67a381b2b8c0317b9a/6554650b477b93838a94d5c5_ANALYTICS%20APPROVED%20IMAGE.png",
      "text": "Clue 2"
    },
    {
      "contentImgUrl": "https://assets-global.website-files.com/6536cb67a381b2b8c0317b9a/6554652ab384111406b994f1_why%2520image-p-800.png",
      "text": "Clue 3"
    },
    {
      "contentImgUrl": "https://assets-global.website-files.com/6536cb67a381b2b8c0317b9a/6554652ab384111406b994f1_why%2520image-p-800.png",
      "text": "Clue 4"
    }
  ]
}
```
