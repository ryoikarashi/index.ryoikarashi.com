import axios from 'axios';
import {APIGatewayProxyEvent, APIGatewayProxyCallback} from "aws-lambda";
import {config} from 'dotenv';
import {isProduction} from "../utils";
import {SpotifyTokenRepository} from "../functions-src/Repositories/TokenRepository/SpotifyTokenRepository";
import {SpotifyTrackRepository} from "../functions-src/Repositories/TrackRepository/SpotifyTrackRepository";
import {SpotifyService} from "../functions-src/Services/Spotify/SpotifyService";
import {PusherService} from "../functions-src/Services/Pusher/PusherService";
import {FirebaseService} from "../functions-src/Services/Firebase/FirebaseService";
import {IOAuthConfig} from "../functions-src/Repositories/TokenRepository/ITokenRepository";

// load environment variables from .env
config();

// initialize firebase
const db = new FirebaseService({
    databaseURL: process.env.FIRESTORE_DB_URL || '',
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY || '',
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL || '',
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || '',
}).init();

// initialize pusher
const pusher = new PusherService({
    appId: process.env.PUSHER_APP_ID || '',
    key: process.env.PUSHER_KEY || '',
    secret: process.env.PUSHER_SECRET || '',
    cluster: process.env.PUSHER_CLUSTER || '',
    useTLS: process.env.PUSHER_USE_TLS === 'true',
}).init();

const spotifyOAuthConfig: IOAuthConfig = {
    clientId: process.env.SPOTIFY_CLIENT_ID || '',
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',
    authorizationCode: process.env.SPOTIFY_AUTHORIZATION_CODE || '',
    basicAuthorizationCode: Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`, 'utf-8').toString('base64'),
    redirectUri: process.env.GOOGLE_API_REDIRECT_URI || '',
};

export const handler = async function (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    event: APIGatewayProxyEvent,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context: never,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    callback: APIGatewayProxyCallback
): Promise<any> {
    // composition root with pure DI
    const spotify = new SpotifyService(
        new SpotifyTokenRepository(db),
        new SpotifyTrackRepository(db, axios),
        axios,
        spotifyOAuthConfig
    );

    // get a currently playing track with an access token
    const token = await spotify.getToken();
    const data = await spotify.getCurrentlyListeningTrack(token.accessToken);

    // send a currently listening track data to the client
    await pusher.trigger('spotify', 'fetch-currently-listening-track', data.toPlainObj());

    // return response
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin':
                isProduction ? 'https://ryoikarashi.com' : 'http://localhost:8000',
        },
        body: data.toJson(),
    };
};

process.on('uncaughtException', function (err) {
    console.error(err);
});
