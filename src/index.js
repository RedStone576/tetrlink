import { Hono } from "hono"
import { InteractionResponseType, InteractionType, verifyKey } from "discord-interactions"

import config from "./config.js"
import * as discord from "./discord.js"
import * as storage from "./storage.js"

const app = new Hono()

app.get("/", (c) => c.text("urmom"))

app.get("/linked-role", async (c) =>
{
  const { url, state } = discord.getOAuthUrl()

  c.cookie("client_state", state, { maxAge: 1000 * 60 * 5, signed: true })
  return c.redirect(url)
})

app.get("/oauth-callback", async (c) =>
{
  try
  {
    const code  = c.req.query("code")
    const state = c.req.query("state")

    if (c.req.cookie("client_state") !== state) return c.text("state verification failed", 403)
    
    const tokens = await discord.getOAuthTokens(code)
    const data   = await discord.getUserData(tokens)
    
    await storage.storeDiscordTokens(data.user.id, {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: Date.now() + tokens.expires_in * 1000
    })
    
    await updateMetadata(data.user.id)
    
    return c.text("connected! you may now close this window")
  }
  
  catch(e)
  {
    console.log(e)
    
    return c.text("oh uh, something wrong happened", 500)
  }
})

app.post("/interactions", async (c) =>
{
  const signature = c.req.header("x-signature-ed25519")
  const timestamp = c.req.header("x-signature-timestamp")

  const raw     = await c.req.clone().arrayBuffer()
  const isValid = verifyKey(raw, signature, timestamp, config.DISCORD_PUBLIC_KEY)

  if (!isValid) 
  {
    console.error("Invalid Request")
    
    return c.text("Bad request signature.", 401)
  }

  const message = await c.req.json()
  
  if (message.type === InteractionType.PING) 
  {
    console.log("ping!")
    
    return c.json({ type: InteractionResponseType.PONG })
  }
  
  else if (message.type === InteractionType.APPLICATION_COMMAND)
  {    
    const contents = {
      ping: ":ping_pong:",
      refresh: "refreshed!",
      info: ">>> link your tetr.io stats to discord !!\n\nmade with love and skill issue, by RedStone576#7804",
      invite: `<https://discord.com/api/oauth2/authorize?client_id=${config.DISCORD_CLIENT_ID}&permissions=0&scope=bot%20applications.commands>`
    }

    if (!contents.hasOwnProperty(message.data.name.toLowerCase()))
    {
      console.log("unknown command")
    
      return c.json({ error: "Unknown Type" }, 400)
    }
    
    if (message.data.name.toLowerCase() === "refresh") 
    {
      c.executionCtx.waitUntil(new Promise(async (resolve) =>
      {
        await updateMetadata(message.member.user.id)
        
        resolve()
      }))
      
      return c.json({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: contents.refresh
        }
      })
    }
    
    return c.json({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: contents[message.data.name.toLowerCase()]
      }
    })
  }
  
  else
  {
    console.log("unknown interactions type")
  
    return c.json({ error: "Unknown Type" }, 400)
  }
})

async function updateMetadata(id) 
{
  const tokens = await storage.getDiscordTokens(id)
  
  if (Object.keys(tokens).length > 0)
  {
    try 
    {
      let body = {
        platform_username: "/u/user",
        metadata: {}    
      }
      
      let res1 = await fetch(`https://ch.tetr.io/api/users/search/${id}`)
          res1 = await res1.json()
      
      if (res1.data === null) return "you don't have a tetr.io account linked to your discord!\ngo to config -> account -> connections -> select discord\nreport if you think this is an error"
      
      body.platform_username = `/u/${res1.data.user.username}`
      
      let res2 = await fetch(`https://ch.tetr.io/api/users/${res1.data.user._id}`)
          res2 = await res2.json()
          
      body.metadata.apm = Math.floor(res2.data.user?.league?.apm || 0)
      body.metadata.pps = Math.floor(res2.data.user?.league?.pps || 0)
      body.metadata.vs  = Math.floor(res2.data.user?.league?.vs  || 0)
      
      let res3 = await fetch(`https://ch.tetr.io/api/users/${res2.data.user._id}/records`)
          res3 = await res3.json()
      
      const time = res3.data.records?.["40l"]?.record?.endcontext?.finalTime || 0
          
      body.metadata["_40l"] = (60 * Math.floor(Math.round(time) / 60000)) + Math.floor((Math.round(time) / 1000) % 60)
      body.metadata.blitz   = res3.data.records.blitz.record?.endcontext?.score || 0
      
      await discord.pushMetadata(id, tokens, body)
      
      console.log("updated")
    
      return "refreshed!"
    } 
    
    catch (e) 
    {
      console.log(e)
    
      await discord.pushMetadata(id, tokens, {})
      
      return "error"
    }
  }
  
  else return "you don't have an account linked!\nreport if you think this is an error"
}

export default app
