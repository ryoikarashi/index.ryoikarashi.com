import { SpotifyService } from './SpotifyService';
import { Track, TrackPlainObj } from '../../Entities/Track/Track';
import { Name } from '../../Entities/Track/Name';
import { Artist } from '../../Entities/Track/Artist';
import { IsPlaying } from '../../Entities/Track/IsPlaying';
import { Link } from '../../Entities/Track/Link';
import { Token } from '../../Entities/Token/Token';
import { AccessToken } from '../../Entities/Token/AccessToken';
import { RefreshToken } from '../../Entities/Token/RefreshToken';
import { ITrackRepository } from '../../Repositories/TrackRepository/ITtrackRepository';
import { ITokenService } from '../Token/ITokenService';

/////////////////////////////////////////////////////////////////////
/// Mock SpotifyTrackRepository
/////////////////////////////////////////////////////////////////////
const playingTrack = new Track(
    Name.of('track_name'),
    Artist.of('artist'),
    IsPlaying.of(true),
    Link.of('https://example.com/track'),
);

const notPlayingTrack = new Track(
    Name.of('track_name'),
    Artist.of('artist'),
    IsPlaying.of(false),
    Link.of('https://example.com/track'),
);

class MockSpotifyTrackRepository implements ITrackRepository {
    getCurrentlyListeningTrack(accessToken: AccessToken, callback: () => Promise<AccessToken>): Promise<Track> {
        return Promise.resolve(playingTrack);
    }

    getLastPlayedTrack(): Promise<Track> {
        return Promise.resolve(playingTrack);
    }

    storeLastPlayedTrack(data: TrackPlainObj): Promise<void> {
        return Promise.resolve();
    }
}

/////////////////////////////////////////////////////////////////////
/// Mock TokenService
/////////////////////////////////////////////////////////////////////
const accessToken = AccessToken.of('access_token');
const refreshToken = RefreshToken.of('refresh_token');
const token = new Token(accessToken, refreshToken);
const newAccessToken = AccessToken.of('new_access_token');

class MockTokenService implements ITokenService {
    getAccessAndRefreshToken(): Promise<Token> {
        return Promise.resolve(token);
    }

    refreshAccessToken(): Promise<AccessToken> {
        return Promise.resolve(newAccessToken);
    }
}

// clear all mocks after each test
afterEach(() => {
    jest.clearAllMocks();
});

describe('Test SpotifyService', () => {
    describe('getCurrentlyListeningTrack', () => {
        const tokenService = new MockTokenService();
        const trackRepository = new MockSpotifyTrackRepository();
        const service = new SpotifyService(trackRepository, tokenService);

        it('returns a track which is being played', async () => {
            const mockGetAccessAndRefreshToken = jest
                .spyOn(tokenService, 'getAccessAndRefreshToken')
                .mockResolvedValue(token);
            const mockGetCurrentlyListeningTrack = jest
                .spyOn(trackRepository, 'getCurrentlyListeningTrack')
                .mockResolvedValue(playingTrack);

            await expect(service.getCurrentlyListeningTrack()).resolves.toEqual(playingTrack);
            expect(mockGetAccessAndRefreshToken).toHaveBeenCalledTimes(1);
            expect(mockGetCurrentlyListeningTrack).toHaveBeenCalledTimes(1);
            expect(mockGetCurrentlyListeningTrack).toHaveBeenLastCalledWith(token.accessToken, expect.any(Function));
        });

        it('returns a track which is NOT being played', async () => {
            const mockGetAccessAndRefreshToken = jest
                .spyOn(tokenService, 'getAccessAndRefreshToken')
                .mockResolvedValue(token);
            const mockGetCurrentlyListeningTrack = jest
                .spyOn(trackRepository, 'getCurrentlyListeningTrack')
                .mockResolvedValue(notPlayingTrack);

            await expect(service.getCurrentlyListeningTrack()).resolves.toEqual(notPlayingTrack);
            expect(mockGetAccessAndRefreshToken).toHaveBeenCalledTimes(1);
            expect(mockGetCurrentlyListeningTrack).toHaveBeenCalledTimes(1);
            expect(mockGetCurrentlyListeningTrack).toHaveBeenLastCalledWith(token.accessToken, expect.any(Function));
        });
    });
});
