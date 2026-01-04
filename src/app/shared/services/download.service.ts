import { Injectable } from '@angular/core';

/**
 * Service for handling file downloads in the browser.
 * Encapsulates browser APIs for testability.
 */
@Injectable({
  providedIn: 'root'
})
export class DownloadService {
  /**
   * Downloads a Blob as a file with the specified filename.
   * @param blob The blob data to download
   * @param filename The name for the downloaded file
   */
  downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.URL.revokeObjectURL(url);
  }
}