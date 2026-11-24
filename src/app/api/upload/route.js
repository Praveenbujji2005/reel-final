import { NextResponse } from 'next/server';
import { storage, isFirebaseConfigured } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
const MAX_IMAGE_SIZE = 25 * 1024 * 1024;

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const customFolder = formData.get('folder');

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { success: false, error: 'No valid file provided for upload.' },
        { status: 400 }
      );
    }

    const mimeType = file.type || '';
    const isVideo = mimeType.startsWith('video/') || (file.name && /\.(mp4|mov|webm|m4v)$/i.test(file.name));
    const isImage = mimeType.startsWith('image/') || (file.name && /\.(jpg|jpeg|png|webp|gif|avif|heic)$/i.test(file.name));

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

    let targetFolder = 'images';
    if (customFolder === 'hero-videos' || isVideo || customFolder === 'videos' || customFolder === 'hero') {
      targetFolder = 'hero-videos';
    } else if (customFolder && typeof customFolder === 'string' && /^[a-zA-Z0-9_-]+$/.test(customFolder)) {
      targetFolder = customFolder;
    }

    const originalName = file.name || (isVideo ? 'video.mp4' : 'image.jpg');
    const ext = path.extname(originalName) || (isVideo ? '.mp4' : '.jpg');
    const baseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueFilename = `${Date.now()}_${baseName}${ext}`;
    const storagePath = `${targetFolder}/${uniqueFilename}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (isFirebaseConfigured && storage) {
      try {
        const storageRef = ref(storage, storagePath);
        const metadata = {
          contentType: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
          customMetadata: {
            uploadedAt: new Date().toISOString(),
            originalName: file.name || '',
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
          originalName: file.name || '',
          size: file.size,
          mimeType: file.type,
          storage: 'firebase_storage',
        });
      } catch (storageErr) {
        console.error('[API /api/upload] Firebase Storage upload error:', storageErr);
        if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
          return NextResponse.json(
            {
              success: false,
              error: `Cloud Storage upload failed: ${storageErr.message || storageErr}. Please verify Firebase Storage Security Rules.`,
              code: storageErr.code || 'storage_error',
            },
            { status: 500 }
          );
        }
      }
    }

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
        mimeType: file.type,
        storage: 'local_dev',
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Cloud storage is required in production. Please configure Firebase Storage.',
      },
      { status: 500 }
    );
  } catch (err) {
    console.error('[API /api/upload] Unexpected error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'File upload failed.' },
      { status: 500 }
    );
  }
}
