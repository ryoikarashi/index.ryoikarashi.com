import './index.html';
import './index.css';

import axios, {AxiosResponse} from 'axios';

const getCurrentlyPlaying = (): Promise<AxiosResponse> =>
    axios.get('//localhost:9000/currently-playing');

document.addEventListener('DOMContentLoaded', async () => {
    const { data } = await getCurrentlyPlaying();
    const $spotifyElement = document.getElementById('spotify');
    const track = data?.item?.name;
    const artist = data?.item?.artists[0]?.name;
    const trackUrl = data?.item?.external_urls?.spotify;
    if ($spotifyElement) {
        $spotifyElement.innerHTML = track && artist && trackUrl
            ? `<a href="${trackUrl}" target="_blank">♫ Currently playing: ${data.item.name} - ${artist}</a>`
            : `Nothing's playing right now. Check back later. :)`;
    }
});
