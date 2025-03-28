/**
 * Safe file system operations with proper error handling
 */

import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

/**
 * Ensures a directory exists, creating it if necessary
 */
export async function ensureDir(dir: string): Promise<void> {
  try {
    if (!existsSync(dir)) {
      await fs.mkdir(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }

    // Always set directory permissions to be fully accessible
    await fs.chmod(dir, 0o777);
    console.log(`Set directory permissions for ${dir} to 777`);
  } catch (error) {
    console.error(`Failed to ensure directory ${dir}:`, error);
    throw error;
  }
}

/**
 * Safely writes data to a file using a temporary file
 */
export async function safeWriteFile(
  filePath: string,
  data: unknown,
  options: { ensureDirectory?: boolean } = {}
): Promise<void> {
  const { ensureDirectory = true } = options;
  const tempPath = `${filePath}.tmp`;

  try {
    // Ensure the directory exists if requested
    if (ensureDirectory) {
      await ensureDir(path.dirname(filePath));
    }

    // Write to temporary file first
    await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');

    // Always set file permissions to be readable
    await fs.chmod(tempPath, 0o666);
    console.log(`Set file permissions for ${tempPath} to 666`);

    // Rename temporary file to target file (atomic operation)
    await fs.rename(tempPath, filePath);

    // Set permissions on final file
    await fs.chmod(filePath, 0o666);
    console.log(`Set file permissions for ${filePath} to 666`);

  } catch (error) {
    // Clean up temporary file if it exists
    try {
      if (existsSync(tempPath)) {
        await fs.unlink(tempPath);
      }
    } catch (cleanupError) {
      console.error('Failed to clean up temporary file:', cleanupError);
    }
    throw error;
  }
}

/**
 * Safely reads and parses a JSON file
 */
export async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

/**
 * Safely deletes a file if it exists
 */
export async function safeDeleteFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
}

/**
 * Lists all files in a directory with the given extension
 */
export async function listFiles(dir: string, ext?: string): Promise<string[]> {
  try {
    const files = await fs.readdir(dir);
    if (ext) {
      return files.filter(f => f.endsWith(ext));
    }
    return files;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
} 