import { NextResponse } from 'next/server';
import { put, list } from '@vercel/blob';

export async function POST(request) {
  try {
    const userData = await request.json();

    // Read existing users from Vercel Blob
    let users = [];
    try {
      const { blobs } = await list({ prefix: 'users.json' });
      if (blobs.length > 0) {
        const response = await fetch(blobs[0].downloadUrl, {
          headers: {
            Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
          },
        });
        if (response.ok) {
          const text = await response.text();
          if (text) {
            try {
              users = JSON.parse(text);
            } catch (e) {
              console.warn('Invalid JSON in blob, proceeding with empty array');
            }
          }
        }
      }
    } catch (readError) {
      console.warn('Could not read existing users list (might not exist yet or no token set). Proceeding with an empty array.', readError);
    }

    // Append new user
    users.push(userData);

    // Save back to Vercel Blob, overwriting the same file without random suffix
    await put('users.json', JSON.stringify(users, null, 2), {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json'
    });

    return NextResponse.json({
      success: true,
      message: 'User data saved successfully via Vercel Blob'
    });
  } catch (error) {
    console.error('Error saving user:', error);
    return NextResponse.json(
      { success: false, error: error.message || String(error) },
      { status: 500 }
    );
  }
}
