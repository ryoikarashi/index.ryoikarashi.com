import {AlbumId} from "../../Entities/Photo/AlbumId";
import {Photo} from "../../Entities/Photo/Photo";
import {Url} from "../../Entities/Photo/Url";
import {IPhotoService} from "./IPhotoService";
import {IPhotoRepository} from "../../Repositories/PhotoRepository/IPhotoRepository";
import {ITokenService} from "../Token/ITokenService";

export class GooglePhotoService implements IPhotoService {
    private readonly _photoRepo: IPhotoRepository;
    private readonly _tokenService: ITokenService;

    constructor(photoRepo: IPhotoRepository, tokenService: ITokenService) {
        this._photoRepo = photoRepo;
        this._tokenService = tokenService;
    }

    async getARandomPhotoFromAlbum(albumId: AlbumId): Promise<Photo> {
        const token = await this._tokenService.getAccessAndRefreshToken();

        const photos = await this._photoRepo.getPhotosFromAlbum(albumId, token.accessToken, async () => {
            return await this._tokenService.refreshAccessToken();
        });
        const randomIndex = Math.floor(Math.random() * photos.length);
        const randomPhoto = photos?.[randomIndex];

        if (!randomPhoto) {
            return new Photo(
                Url.of(null),
            );
        }

        return randomPhoto;
    }
}
