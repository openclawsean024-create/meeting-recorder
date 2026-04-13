import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: '缺少 OPENAI_API_KEY，請在環境變數中設定。' },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const audioFile = formData.get('audio') as File | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: '未提供音訊檔案' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3'];
    if (!allowedTypes.includes(audioFile.type) && !audioFile.name.match(/\.(webm|mp4|m4a|wav|ogg|mp3)$/i)) {
      return NextResponse.json(
        { error: '不支援的音訊格式，請上傳 webm, mp4, m4a, wav, ogg, mp3 格式' },
        { status: 400 }
      );
    }

    // Size limit: 25MB
    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: '檔案過大，最大支援 25MB' },
        { status: 400 }
      );
    }

    // Convert File to Buffer for OpenAI API
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create a mock File-like object for OpenAI
    // OpenAI SDK accepts { name, type, arrayBuffer } or a Node ReadStream
    // We need to use a ReadableStream approach with a Blob
    const blob = new Blob([buffer], { type: audioFile.type });
    const fileName = audioFile.name || `audio.${audioFile.type.split('/')[1]}`;

    // Use OpenAI Audio API - create a proper file object
    const file = new File([blob], fileName, { type: audioFile.type });

    const transcript = await openai.audio.transcriptions.create({
      file: file,
      model: 'gpt-4o-transcribe',
      language: 'zh',
      response_format: 'text',
    });

    return NextResponse.json({
      text: transcript,
    });
  } catch (error: unknown) {
    console.error('Transcript error:', error);
    const err = error as { status?: number; message?: string; code?: string };
    
    if (err.code === 'invalid_api_key') {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY 無效，請檢查設定。' },
        { status: 401 }
      );
    }
    if (err.status === 401) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY 無效或已過期。' },
        { status: 401 }
      );
    }
    if (err.status === 429) {
      return NextResponse.json(
        { error: 'API 配額已用盡，請稍後再試。' },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: `轉錄失敗：${err.message || '未知錯誤'}` },
      { status: 500 }
    );
  }
}
