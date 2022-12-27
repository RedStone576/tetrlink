/*
 * only run this file once unless you edit something or idk
 */

import fetch from "node-fetch"
import config from "./config.js"

registerCommandMetadata(true)
registerConnectionMetadata()

async function registerCommandMetadata(isGlobal)
{
  const url = isGlobal ? `https://discord.com/api/v10/applications/${config.DISCORD_CLIENT_ID}/commands` : `https://discord.com/api/v10/applications/${config.DISCORD_CLIENT_ID}/guilds/${config.DISCORD_TEST_GUILD}/commands`

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bot ${config.DISCORD_TOKEN}`,
    },
    body: JSON.stringify([
      {
        "name": "ping",
        "description": "pong",
        "dm_permission": false
      },
    
      {
        "name": "refresh",
        "description": "refresh your stats info",
        "dm_permission": false
      },
      
      {
        "name": "invite",
        "description": "invite the bot",
        "dm_permission": false
      },
      
      {
        "name": "info",
        "description": "get info about the bot",
        "dm_permission": false
      }
    ])
  })
  
  if (res.ok) 
  {
    const data = await res.json()
    
    console.log(data)
  } 
  
  else 
  {
    const data = await res.text()
   
    console.log(data)
  }
}

async function registerConnectionMetadata()
{
  const url = `https://discord.com/api/v10/applications/${config.DISCORD_CLIENT_ID}/role-connections/metadata`

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bot ${config.DISCORD_TOKEN}`
    },
    body: JSON.stringify([
      {
        key: "apm",
        name: "APM",
        description: "minimum attack per minute (greater than)",
        type: 2
      },
      
      {
        key: "pps",
        name: "PPS",
        description: "minimum pieces per second (greater than)",
        type: 2
      },
      
      {
        key: "vs",
        name: "VS",
        description: "minimum vs (greater than)",
        type: 2
      },
      
      {
        key: "_40l",
        name: "seconds 40 Lines",
        description: "minimum seconds of 40 Lines record time (less than)",
        type: 1
      },
      
      {
        key: "blitz",
        name: "Blitz",
        description: "Blitz record score (greater than)",
        type: 2
      }
    ])
  })
  
  if (res.ok) 
  {
    const data = await res.json()
    
    console.log(data)
  } 
  
  else 
  {
    const data = await res.text()
   
    console.log(data)
  }
}
