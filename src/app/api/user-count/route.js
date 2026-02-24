import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';

export async function GET() {
  try {
    let count = 0;

    try {
      const { blobs } = await list({ prefix: 'users.json' });

      if (blobs.length > 0) {
        const response = await fetch(blobs[0].downloadUrl, {
          headers: {
            Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
          },
        });
        if (response.ok) {
          const users = await response.json();
          count = users.length;
        }
      }
    } catch (readError) {
      console.warn('Could not read user count from Blob (might not exist yet).', readError);
    }

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error in user count route:', error);
    return NextResponse.json({ count: 0 });
  }
}
