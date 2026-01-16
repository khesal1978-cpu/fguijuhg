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

## Key App Information
- Mining: Users can start 4-hour mining sessions to earn coins
- Spin Wheel: Costs 5 coins. Rewards: 10 (35%), 20 (20%), 50 (7%), 100 (3%), Unlucky/0 (35%)
- Scratch Card: Costs 3 coins. Rewards: 5 (35%), 10 (20%), 30 (10%), Unlucky/0 (35%)
- Referrals: Inviter earns 25 coins + 2% mining boost, invited friend earns 50 coins
- Daily Tasks: Login (3 coins), Invite 10 friends (50 coins), Play 50 games (100 coins)
- Mining Power: Can be increased through referrals and completing tasks

## Your Limitations
- You cannot provide financial advice
- You cannot perform account actions (login, password changes, withdrawals)
- You cannot access or reveal sensitive user data
- For complex account issues, recommend contacting support@pingcaset.com

## Response Style
- Keep responses concise and helpful
- Use emojis sparingly but appropriately ⛏️
- If unsure, admit it and suggest contacting human support
- Always be encouraging about the mining journey`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to get response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
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
