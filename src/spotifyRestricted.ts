import { type AccessToken, SpotifyApi, type Track, type SavedTrack } from '@spotify/web-api-ts-sdk'

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
      console.info("Made with access token", opts.accessToken.access_token)
      this.client = SpotifyApi.withAccessToken(opts.clientId, opts.accessToken)
    } else {
      this.client = SpotifyApi.withClientCredentials(opts.clientId, opts.clientSecret ?? '', SCOPES)
    }
  }

  async findRestrictedTracks (playlistId?: string): Promise<SavedTrack[]> {
    if (playlistId != null) {
      console.info('Not implemented yet')
      return []
    } else {
      let processedTracksCount = 0
      let totalTracks = 0
      const restrictedTracks: SavedTrack[] = []
      do {
        // fetch page of tracks
        const resultsPage = await this.client.currentUser.tracks.savedTracks(PER_PAGE, processedTracksCount)
        // find tracks
        restrictedTracks.concat(SpotifyRestricted.filterRestrictedSavedTracks(resultsPage.items))
        totalTracks = resultsPage.total
        processedTracksCount += PER_PAGE
      } while (processedTracksCount < totalTracks)
      return restrictedTracks
    }
  }

  static filterRestrictedTracks = (items: Track[]): Track[] => {
    return items.filter((track: Track) => !(track.is_playable ?? false) || track.restrictions?.reason)
  }

  static filterRestrictedSavedTracks = (items: SavedTrack[]): SavedTrack[] => {
    return items.filter((track: SavedTrack) => !(track.track.is_playable ?? false) || track.track.restrictions?.reason)
  }

  static printTrack = (track: Track): void => {
    console.info(`${track.id}, ${track.artists.join(', ')} - ${track.name} | Reason: ${track.restrictions?.reason}`)
  }

  static printSavedTrack = (track: SavedTrack): void => {
    console.info(`${track.track.id}, ${track.track.artists.join(', ')} - ${track.track.name} | Reason: ${track.track.restrictions?.reason}`)
  }

  static SCOPES = SCOPES
}
