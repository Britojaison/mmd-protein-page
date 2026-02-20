import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'users.json');
    
    let count = 0;
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const users = JSON.parse(fileContent);
      count = users.length;
    }
    
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error reading user count:', error);
    return NextResponse.json({ count: 0 });
  }
}
