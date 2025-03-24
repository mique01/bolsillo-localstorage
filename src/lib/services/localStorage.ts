// Simple file storage service using localStorage
// This is a simplified version that works with file data URLs instead of actual files

interface StorageFile {
  id: string;
  name: string;
  type: string;
  data: string; // base64/data URL
  user_id: string;
  created_at: string;
  path?: string;
  bucket?: string;
}

// Helper functions to work with localStorage
function getCollection<T>(collectionName: string): T[] {
  try {
    const collection = localStorage.getItem(collectionName);
    return collection ? JSON.parse(collection) : [];
  } catch (error) {
    console.error(`Error fetching ${collectionName}:`, error);
    return [];
  }
}

function saveCollection<T>(collectionName: string, data: T[]): void {
  try {
    localStorage.setItem(collectionName, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${collectionName}:`, error);
  }
}

/**
 * Convert a File object to a data URL
 */
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Upload file to localStorage
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File,
  userId: string
): Promise<{ data: { id: string; path: string } | null; error: Error | null }> {
  try {
    // Convert file to data URL
    const dataUrl = await fileToDataUrl(file);
    
    // Add to storage collection
    const storageFiles = getCollection<StorageFile>('storage_files');
    
    const newFile: StorageFile = {
      id: Date.now().toString(),
      name: file.name,
      type: file.type,
      data: dataUrl,
      user_id: userId,
      created_at: new Date().toISOString(),
      path,
      bucket
    };
    
    storageFiles.push(newFile);
    saveCollection('storage_files', storageFiles);
    
    return { 
      data: { 
        id: newFile.id, 
        path: `${bucket}/${path}/${newFile.id}` 
      }, 
      error: null 
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get public URL for a file (in this case, just return the data URL)
 */
export function getPublicUrl(bucket: string, path: string): string {
  const storageFiles = getCollection<StorageFile>('storage_files');
  const file = storageFiles.find(f => 
    f.bucket === bucket && f.path === path
  );
  
  return file?.data || '';
}

/**
 * Download a file (get its data URL)
 */
export async function downloadFile(
  bucket: string,
  path: string
): Promise<{ data: string | null; error: Error | null }> {
  try {
    const storageFiles = getCollection<StorageFile>('storage_files');
    const file = storageFiles.find(f => 
      f.bucket === bucket && f.path === path
    );
    
    if (!file) {
      return { data: null, error: new Error('File not found') };
    }
    
    return { data: file.data, error: null };
  } catch (error) {
    console.error('Error downloading file:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * List files in a bucket
 */
export async function listFiles(
  bucket: string,
  userId: string,
  prefix: string = ''
): Promise<{ data: Array<{ name: string; id: string; publicUrl: string }> | null; error: Error | null }> {
  try {
    const storageFiles = getCollection<StorageFile>('storage_files');
    
    const files = storageFiles
      .filter(f => f.bucket === bucket && f.user_id === userId && (!prefix || f.path?.startsWith(prefix)))
      .map(f => ({
        name: f.name,
        id: f.id,
        publicUrl: f.data
      }));
    
    return { data: files, error: null };
  } catch (error) {
    console.error('Error listing files:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Remove a file
 */
export async function removeFile(
  bucket: string,
  paths: string | string[]
): Promise<{ data: { path: string }[] | null; error: Error | null }> {
  try {
    const storageFiles = getCollection<StorageFile>('storage_files');
    const pathsArray = Array.isArray(paths) ? paths : [paths];
    
    const filteredFiles = storageFiles.filter(f => 
      !(f.bucket === bucket && pathsArray.includes(f.path || ''))
    );
    
    saveCollection('storage_files', filteredFiles);
    
    const removedPaths = pathsArray.map(path => ({ path }));
    return { data: removedPaths, error: null };
  } catch (error) {
    console.error('Error removing file:', error);
    return { data: null, error: error as Error };
  }
} 