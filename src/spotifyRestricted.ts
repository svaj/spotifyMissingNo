import { type AccessToken, SpotifyApi, type Track, type SavedTrack } from '@spotify/web-api-ts-sdk'
import { writeFileSync } from 'fs'

export const SCOPES = ['user-library-read']
export const PER_PAGE = 50

export interface SRConstructorType {
  clientId: string
  clientSecret?: string
  accessToken?: AccessToken
}

export class SpotifyRestricted {
  client: SpotifyApi

  constructor (opts: SRConstructorType) {
    if ((opts.accessToken?.access_token) != null) {
      console.info('Made with access token', opts.accessToken.access_token)
      this.client = SpotifyApi.withAccessToken(opts.clientId, opts.accessToken)
    } else {
      this.client = SpotifyApi.withClientCredentials(opts.clientId, opts.clientSecret ?? '', SCOPES)
    }
  }

  async findRestrictedTracks (playlistId?: string): Promise<Track[]> {
    let allResults: SavedTrack[] = []
    if (playlistId != null) {
      console.info('Not implemented yet')
      return []
    } else {
      let processedTracksCount = 0
      let totalTracks = 0
      let restrictedTracks: Track[] = []
      do {
        // TODO GET current user's market
        // fetch page of tracks
        const resultsPage = await this.client.currentUser.tracks.savedTracks(PER_PAGE, processedTracksCount, 'US')
        allResults = [...allResults, ...resultsPage.items]
        // find tracks
        restrictedTracks = [...restrictedTracks, ...SpotifyRestricted.filterRestrictedSavedTracks(resultsPage.items)]
        totalTracks = resultsPage.total
        processedTracksCount += PER_PAGE
      } while (processedTracksCount < totalTracks)
      writeFileSync('savedTracks.json', JSON.stringify(allResults))
      writeFileSync('restrictedTracks.json', JSON.stringify(restrictedTracks))
      return restrictedTracks
    }
  }

  static filterRestrictedTracks = (items: Track[]): Track[] => {
    return items.filter((track: Track) => !(track.is_playable ?? false) || track.restrictions?.reason)
  }

  static filterRestrictedSavedTracks = (items: SavedTrack[]): Track[] => SpotifyRestricted.filterRestrictedTracks(items.map((track: SavedTrack) => track.track))

  static printTrack = (track: Track): void => {
    console.info(`${track.id}, ${SpotifyRestricted.getArtistsStr(track)} - ${track.name} | Reason: ${track.restrictions?.reason}`)
  }

  static printSavedTrack = (track: SavedTrack): void => {
    SpotifyRestricted.printTrack(track.track)
  }

  static getArtistsStr = (track: Track): string => track.artists.map(artist => artist.name).join(', ')

  static SCOPES = SCOPES
}
