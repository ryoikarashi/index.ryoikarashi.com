import axios from 'axios';
import {APIGatewayProxyEvent, APIGatewayProxyCallback} from "aws-lambda";
import {config} from 'dotenv';
import {isProduction} from "../../utils";
import {TokenRepository} from "./Repositories/TokenRepository/TokenRepository";
import {TrackRepository} from "./Repositories/TrackRepository/TrackRepository";
import {SpotifyService} from "./Services/Spotify/SpotifyService";
import {PusherService} from "./Services/Pusher/PusherService";
import {FirebaseService} from "./Services/Firebase/FirebaseService";

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
    encrypted: process.env.PUSHER_ENCRYPTED === 'true',
}).init();

export const handler = async function (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    event: APIGatewayProxyEvent,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context: never,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    callback: APIGatewayProxyCallback
): Promise<any> {
    // composition root with pure DI
    const SpotifyServiceClient = new SpotifyService(
        new TokenRepository(db),
        new TrackRepository(db),
        axios,
        {
            authorizationCode: process.env.SPOTIFY_AUTHORIZATION_CODE || '',
            clientId: process.env.SPOTIFY_CLIENT_ID || '',
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',
        },
    );

    // get a currently playing track with an access token
    const token = await SpotifyServiceClient.getToken();
    const data = await SpotifyServiceClient.getCurrentlyListeningTrack(token.accessToken());

    // send a currently listening track data to the client
    pusher.trigger('spotify', 'fetch-currently-listening-track', data);

    // return response
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin':
                isProduction ? 'https://ryoikarashi.com' : 'http://localhost:8000',
        },
        body: JSON.stringify(data),
    };
};

process.on('uncaughtException', function (err) {
    console.error(err);
});
