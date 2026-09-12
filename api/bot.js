export default async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      message: "Mshortener bot is running"
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      message: "Method not allowed"
    });
  }

  try {
    const update = req.body;

    const message = update?.message;

    if (!message?.chat?.id || !message?.text) {
      return res.status(200).json({ ok: true });
    }

    const chatId = message.chat.id;
    const text = message.text.trim();

    /*
     * Find a TeraBox link
     */
    const urlMatch = text.match(
      /https?:\/\/[^\s]+/i
    );

    if (!urlMatch) {
      await sendTelegramMessage(
        chatId,
        "Please send a valid TeraBox link."
      );

      return res.status(200).json({ ok: true });
    }

    const teraboxUrl = urlMatch[0];

    /*
     * Make sure it is a TeraBox-related URL
     */
    const lowerUrl = teraboxUrl.toLowerCase();

    const isTeraBox =
      lowerUrl.includes("terabox") ||
      lowerUrl.includes("teraboxlink") ||
      lowerUrl.includes("1024tera");

    if (!isTeraBox) {
      await sendTelegramMessage(
        chatId,
        "Please send a valid TeraBox link."
      );

      return res.status(200).json({ ok: true });
    }

    /*
     * Create our shortener link
     */
    const shortenerUrl =
      "https://mterabox-shortener.vercel.app/?url=" +
      encodeURIComponent(teraboxUrl);

    /*
     * Temporary reply.
     * We will replace this with your exact
     * header + image + footer template next.
     */
    const reply =
      "📥 Your link is ready!\n\n" +
      shortenerUrl;

    await sendTelegramMessage(
      chatId,
      reply
    );

    return res.status(200).json({
      ok: true
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      ok: false,
      error: "Internal server error"
    });
  }
}


/*
 * Send a Telegram message
 */
async function sendTelegramMessage(chatId, text) {

  const token = process.env.BOT_TOKEN;

  if (!token) {
    throw new Error("BOT_TOKEN is missing");
  }

  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        disable_web_page_preview: false
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      "Telegram API error: " + errorText
    );
  }
}
