import type { ImageUploadDropzone } from "./image-upload-dropzone";

export const imageUpload = {
  import: (): Promise<typeof ImageUploadDropzone> => new Promise(resolve =>
    import('./image-upload-dropzone').then(({ ImageUploadDropzone }) => resolve(ImageUploadDropzone)
  )),

  init(): void {
    const imageUploadFields = document.querySelectorAll<HTMLElement>('.siglo-image-upload');
    if (imageUploadFields.length) {
      this.import().then(ImageUploadDropzone => imageUploadFields.forEach(element => ImageUploadDropzone.instance(element)))
    }
  }
};