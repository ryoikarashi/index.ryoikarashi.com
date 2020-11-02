import { AxiosStatic } from 'axios';
import { stringify, stringify as QsStringify } from 'query-string';
import { Token } from '../../Entities/Token/Token';
import { AccessToken } from '../../Entities/Token/AccessToken';
import { RefreshToken } from '../../Entities/Token/RefreshToken';
import { IOAuthConfig, ITokenRepository } from './ITokenRepository';

export class SpotifyTokenRepository extends ITokenRepository {
    public constructor(db: FirebaseFirestore.Firestore, collectionName: string, docPath: string) {
        super(db, collectionName, docPath);
    }

    public async getTokenByAuthorizationCode(http: AxiosStatic, config: IOAuthConfig): Promise<Token> {
        const headers = {
            Authorization: `Basic ${config.basicAuthorizationCode}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        };
        const params = {
            grant_type: 'authorization_code',
            code: config.authorizationCode,
            redirect_uri: config.redirectUri,
        };

        const {
            data: { access_token: accessToken, refresh_token: refreshToken },
        } = await http.post('https://accounts.spotify.com/api/token', QsStringify(params), { headers });

        return new Token(AccessToken.of(accessToken), RefreshToken.of(refreshToken));
    }

    public async refreshToken(http: AxiosStatic, expiredToken: Token, config: IOAuthConfig): Promise<Token> {
        const headers = {
            Authorization: `Basic ${config.basicAuthorizationCode}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        };

        const payload = {
            grant_type: 'refresh_token',
            refresh_token: expiredToken.refreshToken.value(),
        };

        const {
            data: { access_token: accessToken, refresh_token: refreshToken },
        } = await http.post('https://accounts.spotify.com/api/token', stringify(payload), { headers });

        return Promise.resolve(new Token(AccessToken.of(accessToken), RefreshToken.of(refreshToken)));
    }
}
