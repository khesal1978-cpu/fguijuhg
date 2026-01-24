import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are PingCaset Assistant, the friendly AI helper for PingCaset Mining Hub.

## Your Personality
- Friendly and approachable
- Clear and concise in explanations
- Trustworthy and honest
- Web3-savvy but able to explain concepts simply for beginners
- Patient with new users

## Your Capabilities
You can help users with:
- Understanding how mining works in PingCaset
- Explaining referral system and bonuses (inviter gets 25 coins, invited gets 50 coins)
- Describing games (Spin Wheel costs 5 coins, Scratch Card costs 3 coins)
- Explaining mining power boosts and how to increase them
- Guiding users through app features
- Troubleshooting common issues
- Explaining daily tasks and rewards
- Managing and tracking daily task progress

## Key App Information
- Mining: Users can start 6-hour mining sessions (max 4 per day) to earn CASET coins
- Base reward: 10 CASET per session, boosted by active referrals
- Referral Multipliers: 1.2x (1-2 referrals), 1.7x (3-5), 2.0x (6-10), 2.5x (11+)
- Spin Wheel: Costs 5 coins. Rewards: 10 (35%), 20 (20%), 50 (7%), 100 (3%), 500 (rare), Unlucky/0 (35%)
- Scratch Card: Costs 3 coins. Rewards: 5 (70%), 10 (20%), 30 (10%)
- Referrals: Inviter earns 25 coins, invited friend earns 50 coins
- Daily Tasks: Login (3 coins), Invite 10 friends (50 coins), Play 50 games (100 coins)
- Tasks reset daily at midnight

## Your Limitations
- You cannot provide financial advice
- You cannot perform account actions (login, password changes, withdrawals)
- You cannot access or reveal sensitive user data
- For complex account issues, recommend contacting support@pingcaset.com

## Response Style
- Keep responses concise and helpful (2-3 sentences when possible)
- Use emojis sparingly but appropriately ⛏️
- If unsure, admit it and suggest contacting human support
- Always be encouraging about the mining journey`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    // Format messages for Gemini API
    const geminiMessages = [
      { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
      { role: "model", parts: [{ text: "Understood! I'm PingCaset Assistant, ready to help users with mining, referrals, games, and daily tasks. How can I help?" }] },
      ...messages.map((msg: { role: string; content: string }) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }]
      }))
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=${GEMINI_API_KEY}&alt=sse`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: geminiMessages,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Failed to get response from AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Transform Gemini SSE format to OpenAI-compatible format for the frontend
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      try {
        const reader = response.body?.getReader();
        if (!reader) return;

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr || jsonStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              
              if (text) {
                // Convert to OpenAI-compatible SSE format
                const openAIFormat = {
                  choices: [{ delta: { content: text } }]
                };
                await writer.write(encoder.encode(`data: ${JSON.stringify(openAIFormat)}\n\n`));
              }
            } catch {
              // Ignore parse errors for incomplete chunks
            }
          }
        }

        await writer.write(encoder.encode("data: [DONE]\n\n"));
      } catch (e) {
        console.error("Stream processing error:", e);
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Help chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
