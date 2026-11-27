import { NextResponse } from 'next/server';
import { storage, isFirebaseConfigured } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { isRequestAdmin } from '@/lib/auth';
import { sanitizeFileName } from '@/lib/sanitize';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_IMAGE_SIZE = 15 * 1024 * 1024;  // 15MB

const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);

const ALLOWED_VIDEO_MIMES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);

const ALLOWED_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.avif',
  '.mp4',
  '.webm',
  '.mov',
]);

export async function POST(request) {
  try {
    // 1. Verify administrative authorization
    if (!isRequestAdmin(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin privileges required to upload media.' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const customFolder = formData.get('folder');

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { success: false, error: 'No valid file provided for upload.' },
        { status: 400 }
      );
    }

    const rawExt = path.extname(file.name || '').toLowerCase();
    const mimeType = (file.type || '').toLowerCase();

    // 2. Validate extension
    if (!ALLOWED_EXTENSIONS.has(rawExt)) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported file extension (${rawExt || 'unknown'}). Allowed: ${Array.from(ALLOWED_EXTENSIONS).join(', ')}`,
        },
        { status: 400 }
      );
    }

    // 3. Validate MIME type
    const isImage = ALLOWED_IMAGE_MIMES.has(mimeType);
    const isVideo = ALLOWED_VIDEO_MIMES.has(mimeType);

    if (!isImage && !isVideo) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported MIME type (${mimeType}). Only verified web image and video formats are permitted.`,
        },
        { status: 400 }
      );
    }

    // 4. Validate file size
    const maxAllowed = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    if (file.size > maxAllowed) {
      return NextResponse.json(
        {
          success: false,
          error: `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit (${Math.round(maxAllowed / (1024 * 1024))}MB).`,
        },
        { status: 400 }
      );
    }

    // 5. Sanitize target folder & file name
    let targetFolder = isVideo ? 'hero-videos' : 'images';
    if (customFolder && typeof customFolder === 'string' && /^[a-zA-Z0-9_-]{1,30}$/.test(customFolder)) {
      targetFolder = customFolder;
    }

    const safeOriginalName = sanitizeFileName(file.name || (isVideo ? 'video.mp4' : 'image.jpg'));
    const safeBase = path.basename(safeOriginalName, rawExt).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueFilename = `${Date.now()}_${safeBase}${rawExt}`;
    const storagePath = `${targetFolder}/${uniqueFilename}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 6. Upload to Firebase Storage
    if (isFirebaseConfigured && storage) {
      try {
        const storageRef = ref(storage, storagePath);
        const metadata = {
          contentType: mimeType,
          customMetadata: {
            uploadedAt: new Date().toISOString(),
            originalName: safeOriginalName,
          },
        };

        const snapshot = await uploadBytes(storageRef, buffer, metadata);
        const downloadUrl = await getDownloadURL(snapshot.ref);

        return NextResponse.json({
          success: true,
          url: downloadUrl,
          downloadUrl,
          storagePath,
          filename: uniqueFilename,
          originalName: safeOriginalName,
          size: file.size,
          mimeType,
          storage: 'firebase_storage',
        });
      } catch (storageErr) {
        console.error('[API /api/upload] Storage error:', storageErr.code || storageErr.message);
        return NextResponse.json(
          {
            success: false,
            error: 'Cloud storage upload failed. Please verify storage permissions.',
          },
          { status: 500 }
        );
      }
    }

    // 7. Local development fallback
    if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', targetFolder);
      await mkdir(uploadsDir, { recursive: true });
      const destinationPath = path.join(uploadsDir, uniqueFilename);
      await writeFile(destinationPath, buffer);
      const localUrl = `/uploads/${targetFolder}/${uniqueFilename}`;

      return NextResponse.json({
        success: true,
        url: localUrl,
        filename: uniqueFilename,
        size: file.size,
        mimeType,
        storage: 'local_dev',
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Cloud storage is required in production environments.',
      },
      { status: 500 }
    );
  } catch (err) {
    console.error('[API /api/upload] Unexpected error:', err.message);
    return NextResponse.json(
      { success: false, error: 'File upload processing failed.' },
      { status: 500 }
    );
  }
}
