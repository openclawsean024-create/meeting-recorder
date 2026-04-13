import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');
  return new OpenAI({ apiKey });
}

interface AnalysisResult {
  decisions: string[];
  actionItems: { task: string; assignee?: string; deadline?: string }[];
  risks: string[];
  summary: string;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: '缺少 OPENAI_API_KEY，請在環境變數中設定。' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { text } = body as { text?: string };

    if (!text || text.trim().length < 10) {
      return NextResponse.json(
        { error: '文字內容過短，無法分析' },
        { status: 400 }
      );
    }

    if (text.length > 80000) {
      return NextResponse.json(
        { error: '文字內容過長，請分段處理' },
        { status: 400 }
      );
    }

    const prompt = `你是一位專業的會議紀錄分析師。請分析以下會議內容，從中提取：

1. **決策（decisions）**：會議中已經確認或同意的事項
2. **行動項（actionItems）**：需要有人執行的工作，格式為「任務描述 @人名（可選） DUE:日期（可選）」
3. **風險（risks）**：會議中提及的潛在問題、疑慮或阻礙
4. **摘要（summary）**：會議的簡短摘要（1-3句話）

請用繁體中文回覆，並嚴格遵循以下 JSON 格式：
{
  "decisions": ["決策1", "決策2"],
  "actionItems": [{"task": "任務描述"}, {"task": "任務 @某人", "deadline": "2024/03/15"}],
  "risks": ["風險1", "風險2"],
  "summary": "會議摘要"
}

以下是會議內容：
---
${text}
---`;

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '你是一位專業的會議紀錄分析師，擅長從會議內容中提取關鍵資訊。嚴格輸出 JSON 格式，不要包含任何其他文字。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 2000,
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) {
      return NextResponse.json(
        { error: '分析失敗，未收到回覆' },
        { status: 500 }
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      return NextResponse.json(
        { error: '分析回覆格式錯誤' },
        { status: 500 }
      );
    }

    const result = parsed as Partial<AnalysisResult>;

    return NextResponse.json({
      decisions: Array.isArray(result.decisions) ? result.decisions : [],
      actionItems: Array.isArray(result.actionItems) ? result.actionItems : [],
      risks: Array.isArray(result.risks) ? result.risks : [],
      summary: typeof result.summary === 'string' ? result.summary : '',
    });
  } catch (error: unknown) {
    console.error('Analyze error:', error);
    const err = error as { status?: number; message?: string; code?: string };
    
    if (err.code === 'invalid_api_key') {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY 無效，請檢查設定。' },
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
      { error: `分析失敗：${err.message || '未知錯誤'}` },
      { status: 500 }
    );
  }
}
