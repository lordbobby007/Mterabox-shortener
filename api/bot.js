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
      return res.status(200).json({
        ok: true
      });
    }

    const chatId = message.chat.id;


    /*
     * Telegram puts the text of a photo message
     * inside message.caption.
     *
     * For normal text messages it is message.text.
     */

    const originalText = (
      message.caption ||
      message.text ||
      ""
    );


    /*
     * Find the TeraBox URL inside the user's
     * original message.
     */

    const urlMatch =
      originalText.match(/https?:\/\/[^\s]+/i);


    /*
     * If there is no URL, do nothing.
     */

    if (!urlMatch) {
      return res.status(200).json({
        ok: true
      });
    }


    const originalUrl = urlMatch[0];


    /*
     * Check that the URL is a TeraBox URL.
     */

    const lowerUrl =
      originalUrl.toLowerCase();

    const isTeraBox =
      lowerUrl.includes("terabox") ||
      lowerUrl.includes("teraboxlink") ||
      lowerUrl.includes("1024tera");


    if (!isTeraBox) {
      return res.status(200).json({
        ok: true
      });
    }


    /*
     * Create the new shortener URL.
     */

    const shortenerUrl =
      "https://mterabox-shortener.vercel.app/?url=" +
      encodeURIComponent(originalUrl);


    /*
     * IMPORTANT:
     *
     * Replace ONLY the original TeraBox URL.
     *
     * Everything else remains exactly as
     * the user wrote it.
     */

    const newText =
      originalText.replace(
        originalUrl,
        shortenerUrl
      );


    /*
     * If the user sent an IMAGE + caption:
     *
     * Send the SAME Telegram image using its
     * original file_id.
     *
     * No resize.
     * No crop.
     * No editing.
     * No new header.
     * No new footer.
     * No Diskwala.
     */

    if (
      message.photo &&
      message.photo.length > 0
    ) {

      const photo =
        message.photo[
          message.photo.length - 1
        ];

      await sendTelegramPhoto(
        chatId,
        photo.file_id,
        newText
      );

      return res.status(200).json({
        ok: true
      });
    }


    /*
     * For a normal text message:
     * send the user's original text with
     * ONLY the TeraBox URL replaced.
     */

    await sendTelegramMessage(
      chatId,
      newText
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
 * Send the SAME Telegram photo.
 */

async function sendTelegramPhoto(
  chatId,
  fileId,
  caption
) {

  const token =
    process.env.BOT_TOKEN;


  if (!token) {
    throw new Error(
      "BOT_TOKEN is missing"
    );
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

        /*
         * Telegram file_id means the original
         * image is reused exactly.
         */
        photo: fileId,

        /*
         * User's complete original caption,
         * with ONLY the TeraBox URL replaced.
         */
        caption: caption
      })
    }
  );


  if (!response.ok) {

    const errorText =
      await response.text();

    throw new Error(
      "Telegram API error: " +
      errorText
    );
  }
}


/*
 * Send a normal text message.
 */

async function sendTelegramMessage(
  chatId,
  text
) {

  const token =
    process.env.BOT_TOKEN;


  if (!token) {
    throw new Error(
      "BOT_TOKEN is missing"
    );
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
        text: text
      })
    }
  );


  if (!response.ok) {

    const errorText =
      await response.text();

    throw new Error(
      "Telegram API error: " +
      errorText
    );
  }
}
