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

    if (!message?.chat?.id) {
      return res.status(200).json({ ok: true });
    }

    const chatId = message.chat.id;

    /*
     * Get text from either:
     * 1. Normal text message
     * 2. Photo caption
     */
    const text = (
      message.caption ||
      message.text ||
      ""
    ).trim();

    /*
     * Find the TeraBox URL
     */
    const urlMatch = text.match(/https?:\/\/[^\s]+/i);

    if (!urlMatch) {
      await sendTelegramMessage(
        chatId,
        "Please send a TeraBox link."
      );

      return res.status(200).json({ ok: true });
    }

    const teraboxUrl = urlMatch[0];

    /*
     * Check that the URL is a TeraBox-related link
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
     * Create the Mshortener link
     */
    const shortenerUrl =
      "https://mterabox-shortener.vercel.app/?url=" +
      encodeURIComponent(teraboxUrl);

    /*
     * If user sent an IMAGE + TeraBox link,
     * send the SAME Telegram image back.
     */
    if (message.photo && message.photo.length > 0) {

      const photo =
        message.photo[message.photo.length - 1];

      /*
       * Header
       */
      await sendTelegramMessage(
        chatId,
        "Only Legends Know What Happened Here"
      );

      /*
       * Same image.
       * We reuse Telegram's file_id, so we do not
       * download, edit, crop, or resize the image.
       */
      await sendTelegramPhoto(
        chatId,
        photo.file_id,
        "Click Here & Enjoy Video 😍🌈👇\n\n" +
        shortenerUrl
      );

      /*
       * Footer
       */
      await sendTelegramMessage(
        chatId,
        "Diskwala 👇\n\n" +
        shortenerUrl
      );

      return res.status(200).json({
        ok: true
      });
    }

    /*
     * If the user sends only a TeraBox link,
     * keep the normal text response working.
     */
    await sendTelegramMessage(
      chatId,
      "📥 Your link is ready!\n\n" +
      shortenerUrl
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
 * Send normal Telegram message
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


/*
 * Send the SAME image received from the user
 */
async function sendTelegramPhoto(
  chatId,
  fileId,
  caption
) {

  const token = process.env.BOT_TOKEN;

  if (!token) {
    throw new Error("BOT_TOKEN is missing");
  }

  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendPhoto`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        chat_id: chatId,
        photo: fileId,
        caption: caption,
        disable_notification: false
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
