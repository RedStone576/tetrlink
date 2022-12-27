# TetrLink

discord linked role stuff for tetr.io stats, using cloudflare workers !!

based on [IanMitchell/discord-trout](https://github.com/IanMitchell/discord-trout) and [discord/linked-roles-sample](https://github.com/discord/linked-roles-sample)

ur gonna need the wrangler thingy, cf workers subdomain, mongodb cluster and uhh patience

you first need to fill the things in `src/config.js` & `wrangler.toml` then run `node src/register.js` once, after that you can just deploy it
