import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    const userData = await request.json();
    
    const filePath = path.join(process.cwd(), 'src', 'data', 'users.json');
    
    // Read existing users
    let users = [];
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      users = JSON.parse(fileContent);
    }
    
    // Append new user
    users.push(userData);
    
    // Save back to file
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
    
    return NextResponse.json({ 
      success: true, 
      message: 'User data saved successfully' 
    });
  } catch (error) {
    console.error('Error saving user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save user data' },
      { status: 500 }
    );
  }
}
