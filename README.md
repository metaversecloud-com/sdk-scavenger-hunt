# Scavenger Hunt

## Introduction / Summary

Scavenger Hunt is an interactive clue-finding game where players follow a series of clues to complete challenges within a Topia world. Admins can configure challenges with images, text clues, and themes.

## Built With

### Client

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

### Server

![Node.js](https://img.shields.io/badge/node.js-%2343853D.svg?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/express-%23000000.svg?style=for-the-badge&logo=express&logoColor=white)

## Key Features

- Follow clues to complete challenges
- Multiple themes supported (e.g., "robot")
- Challenge completion tracking
- Optional reward system (drop a leaf upon completion)

## Implementation Requirements

### Required Assets with Unique Names

| Unique Name                   | Description                                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------------------------- |
| `ScavengerHunt`               | Key asset that manages the scavenger hunt. Required for all instances.                            |
| `ScavengerHuntBuildableAsset` | Optional. Include this asset in the scene if users should be able to drop a leaf upon completion. |
| `ScavengerHunt_{theme}_clue`  | Clue assets with theme variants (e.g., `ScavengerHunt_robot_clue`)                                |

### Data Object Structure

The dropped asset data object should include:

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
      "contentUrl": "https://...",
      "text": "Clue 1"
    }
  ]
}
```

## Environment Variables

Create a `.env` file in the root directory. See `.env-example` for a template.

| Variable               | Description                                                                        | Required |
| ---------------------- | ---------------------------------------------------------------------------------- | -------- |
| `NODE_ENV`             | Node environment                                                                   | No       |
| `SKIP_PREFLIGHT_CHECK` | Skip CRA preflight check                                                           | No       |
| `INSTANCE_DOMAIN`      | Topia API domain (`api.topia.io` for production, `api-stage.topia.io` for staging) | Yes      |
| `INTERACTIVE_KEY`      | Topia interactive app key                                                          | Yes      |
| `INTERACTIVE_SECRET`   | Topia interactive app secret                                                       | Yes      |

## Developers

### Getting Started

Run `npm install` on the root directory.

Notes:

1. Root package.json is for general/shared dependencies
2. Client and Server package.json files are for app specific dependencies
3. Uses NPM Workspaces

### Run in Docker

1. For local development: `docker-compose up`
2. For production build: `docker build . -t [name]:v[version]`

### Add your .env environmental variables

See [Environment Variables](#environment-variables) above.

### Where to find INTERACTIVE_KEY and INTERACTIVE_SECRET

[Topia Dev Account Dashboard](https://dev.topia.io/t/dashboard/integrations)

[Topia Production Account Dashboard](https://topia.io/t/dashboard/integrations)

### Helpful links

- [SDK Developer docs](https://metaversecloud-com.github.io/mc-sdk-js/index.html)
