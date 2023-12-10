import 'dotenv/config'
import { SpotifyRestricted } from './spotifyRestricted'
import express from 'express'
import cookieParser from 'cookie-parser'
import type { Request, Response } from 'express'
import { uuid } from 'uuidv4'
import { type AccessToken } from '@spotify/web-api-ts-sdk'

export const main = async (): Promise<void> => {
  console.info('Starting')
  const app = express()
  app.use(express.json())
  app.use(cookieParser())
  const redirectUri = `${process.env.SERVER_URL ?? ''}oauthRedirect`
  //   const restrictedFinderServer = new SpotifyRestricted({ clientId: process.env.CLIENT_ID ?? '', clientSecret: process.env.CLIENT_SECRET ?? '' })

  app.get('/findRestricted', async (req: Request, res: Response): Promise<void> => {
    if (req.cookies?.accessToken == null) {
      console.info(req.cookies)
      res.send({ error: 'no access token set' })
      return
    }
    const accessToken: AccessToken = JSON.parse(req.cookies.accessToken)
    console.info({ accessToken })
    const restrictedFinderUser = new SpotifyRestricted({ clientId: process.env.CLIENT_ID ?? '', accessToken })

    const restrictedTracks = await restrictedFinderUser.findRestrictedTracks()

    console.info('Restricted tracks:')
    restrictedTracks?.map(SpotifyRestricted.printTrack)
    res.send(restrictedTracks)
  })

  app.post('/oauthRedirect', (req: Request, res: Response) => {
    console.info({ req })
  })

  app.get('/oauthRedirect', async (req: Request, res: Response) => {
    if (!(req.query?.code != null && req.query?.state != null)) {
      res.send({ error: 'no code and state provided, oauth failure.' })
    }
    console.info('Requesting access token for code ', req.query.code)
    const bodyParams = {
      client_id: process.env.CLIENT_ID ?? '',
      grant_type: 'authorization_code',
      code: req.query.code?.toString() ?? '',
      redirect_uri: redirectUri
    }
    const body = new URLSearchParams(bodyParams)
    const authBearer = btoa(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`)
    const result = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authBearer}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body
    })
    const token = await result.json()
    res.cookie('accessToken', JSON.stringify(token), { maxAge: token.expires_in * 3600, path: '/' })
    console.info(token)
    res.redirect(302, '/findRestricted')
  })

  app.get('/login-to-spotify', (req: Request, res: Response) => {
    const state = uuid().substring(0, 16)
    const scopeStr = SpotifyRestricted.SCOPES.join(' ')

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.CLIENT_ID ?? '',
      scope: scopeStr,
      redirect_uri: redirectUri,
      show_dialog: 'true',
      state
    })
    res.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`)
  })

  app.listen(3000, () => {
    console.log('Spotify restricted tracks finder listening on port 3000!')
  })
}

main().catch(e => {
  console.error(e)
})
