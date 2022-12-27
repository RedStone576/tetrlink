import config from "./config.js"
import * as storage from "./storage.js"

export function getOAuthUrl()
{
  const state = crypto.randomUUID()
  const url   = new URL("https://discord.com/api/oauth2/authorize")
  
  url.searchParams.set("client_id", config.DISCORD_CLIENT_ID)
  url.searchParams.set("redirect_uri", config.URL + "/oauth-callback")
  url.searchParams.set("response_type", "code")
  url.searchParams.set("state", state)
  url.searchParams.set("scope", "role_connections.write identify")
  url.searchParams.set("prompt", "consent")
  
  return { 
    state, 
    url: url.toString() 
  }
}

export async function getOAuthTokens(code)
{
  const url = "https://discord.com/api/v10/oauth2/token"
  
  const body = new URLSearchParams({
    client_id: config.DISCORD_CLIENT_ID,
    client_secret: config.DISCORD_CLIENT_SECRET,
    grant_type: "authorization_code",
    code: code,
    redirect_uri: config.URL + "/oauth-callback",
  })

  const response = await fetch(url, {
    body,
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  })
  
  if (response.ok) 
  {
    const data = await response.json()
    
    return data
  } 
  
  else
  { 
    console.error("error at fetching OAuth tokens")
    console.error(await response.json()) 
  }
}

export async function getAccessToken(userId, tokens)
{
  if (Date.now() > tokens.expires_at) 
  {
    const url = "https://discord.com/api/v10/oauth2/token"
    
    const body = new URLSearchParams({
      client_id: config.DISCORD_CLIENT_ID,
      client_secret: config.DISCORD_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: tokens.refresh_token,
    })
    
    const response = await fetch(url, {
      body,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    })
    
    if (response.ok) 
    {
      const tokens = await response.json()
      
      tokens.access_token = tokens.access_token
      tokens.expires_at   = Date.now() + tokens.expires_in * 1000
      
      await storage.storeDiscordTokens(userId, tokens)
      
      return tokens.access_token
    } 
    
    else
    { 
      console.error("error at refreshing token")
      console.error(await response.json())  
    }
  }
  
  return tokens.access_token
}

export async function getUserData(tokens)
{
  const url = "https://discord.com/api/v10/oauth2/@me"
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${tokens.access_token}`
    }
  })
  
  if (response.ok) 
  {
    const data = await response.json()
    
    return data
  } 
  
  else
  { 
    console.error("error at fetching user data")
    console.error(await response.json()) 
  }
}

export async function getMetadata(userId, tokens)
{
  const url = `https://discord.com/api/v10/users/@me/applications/${config.DISCORD_CLIENT_ID}/role-connection`;
  
  const accessToken = await getAccessToken(userId, tokens)
  
  const response = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${accessToken}`
    }
  })
  
  if (response.ok) 
  {
    const data = await response.json()
    
    console.log("ok")
    
    return data
  } 
  
  else
  { 
    console.error("error at getting metadata")
    console.error(await response.json()) 
  }
}

export async function pushMetadata(userId, tokens, body)
{
  const url = `https://discord.com/api/v10/users/@me/applications/${config.DISCORD_CLIENT_ID}/role-connection`;
  
  const accessToken = await getAccessToken(userId, tokens)
  
  const response = await fetch(url, {
    method: "PUT",
    body: JSON.stringify(body),
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    }
  })
  
  if (!response.ok)
  { 
    console.error("error at pushing metadata")
    console.error(await response.json()) 
  }
}
