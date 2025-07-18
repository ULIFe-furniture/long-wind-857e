import { NextRequest, NextResponse } from "next/server";

// Hàm gửi tin nhắn lại cho Zalo OA
async function replyToZaloOA(userId: string, reply: string, accessToken: string) {
  const zaloApi = "https://openapi.zalo.me/v3.0/oa/message";
  const body = {
    recipient: { user_id: userId },
    message: { text: reply }
  };
  await fetch(zaloApi, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "access_token": accessToken
    },
    body: JSON.stringify(body)
  });
}

// Hàm gửi tin nhắn lại cho Facebook Messenger
async function replyToFacebook(senderId: string, reply: string, pageAccessToken: string) {
  const fbApi = `https://graph.facebook.com/v18.0/me/messages?access_token=${pageAccessToken}`;
  const body = {
    recipient: { id: senderId },
    message: { text: reply }
  };
  await fetch(fbApi, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // --- Xác định nguồn gửi (Zalo OA hay Facebook) ---
    let message = "";
    let replyTarget = "";
    let platform = "";
    if (payload.user_id && payload.message && payload.message.text) {
      // Zalo OA webhook
      message = payload.message.text;
      replyTarget = payload.user_id;
      platform = "zalo";
    } else if (payload.entry?.[0]?.messaging?.[0]?.message?.text) {
      // Facebook Messenger webhook
      message = payload.entry[0].messaging[0].message.text;
      replyTarget = payload.entry[0].messaging[0].sender.id;
      platform = "facebook";
    } else {
      return NextResponse.json({ error: "Không xác định được nền tảng hoặc message." }, { status: 400 });
    }

    // --- Gọi OpenAI API ---
    const openaiApiKey = process.env.OPENAI_API_KEY!;
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: message }],
        max_tokens: 200,
      }),
    });
    const openaiData = await openaiRes.json();
    const aiReply = openaiData?.choices?.[0]?.message?.content ?? "Xin lỗi, hệ thống đang bận.";

    // --- Gửi lại kết quả trực tiếp ---
    if (platform === "zalo") {
      const zaloAccessToken = process.env.ZALO_OA_ACCESS_TOKEN!;
      await replyToZaloOA(replyTarget, aiReply, zaloAccessToken);
    } else if (platform === "facebook") {
      const fbAccessToken = process.env.FB_PAGE_ACCESS_TOKEN!;
      await replyToFacebook(replyTarget, aiReply, fbAccessToken);
    }

    // --- Trả về kết quả cho webhook caller (có thể dùng để test/debug) ---
    return NextResponse.json({
      platform,
      original_message: message,
      ai_reply: aiReply,
      reply_target: replyTarget,
    });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi xử lý webhook." }, { status: 500 });
  }
}
