import { createMongoDBDataAPI } from "mongodb-data-api-fetch"
import config from "./config.js"

const client = createMongoDBDataAPI({ apiKey: config.MONGO_API_KEY, urlEndpoint: config.MONGO_API_URL })

export async function storeDiscordTokens(id, tokens)
{
  await client.replaceOne({
    dataSource: config.MONGO_CLUSTER_NAME,
    database: "DiscordIds",
    collection: "ids",
    upsert: true,
    filter: { 
      name: `discord-${id}` 
    },
    replacement: {
      name: `discord-${id}`,
      tokens: tokens
    }
  })
}

export async function getDiscordTokens(id)
{
  const { document } = await client.findOne({
    dataSource: config.MONGO_CLUSTER_NAME,
    database: "DiscordIds",
    collection: "ids",
    filter: { 
      name: `discord-${id}` 
    }
  })
  
  return document.tokens ?? {}
}
