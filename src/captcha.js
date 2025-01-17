const pendingUsers = new Map();

// Ограниченные права для новых участников
const restrictedPermissions = {
  can_send_messages: false,
  can_send_media_messages: false,
  can_send_audios: false,
  can_send_voice_notes: false,
  can_send_videos: false,
  can_send_polls: false,
  can_send_other_messages: false,
  can_add_web_page_previews: false,
};

// Полные права после прохождения капчи
const fullPermissions = {
  can_send_messages: true,
  can_send_media_messages: true,
  can_send_audios: true,
  can_send_voice_notes: true,
  can_send_videos: true,
  can_send_polls: true,
  can_send_other_messages: true,
  can_add_web_page_previews: true,
};

// Настроить капчу
const setupCaptcha = (bot, captchaTimeout) => {
  console.log('Настройка капчи...');

  // Обработка новых участников
  bot.on('message', async (msg) => {
    if (!msg.new_chat_members) return;

    const newMembers = msg.new_chat_members;
    const chatId = msg.chat.id;

    for (const member of newMembers) {
      const userId = member.id;

      // Ограничиваем права
      await bot
        .restrictChatMember(chatId, userId, restrictedPermissions)
        .catch(console.error);

      // Создаем клавиатуру с помощью объекта
      const keyboard = {
        inline_keyboard: [
          [{ text: 'Я не бот', callback_data: `captcha_passed_${userId}` }],
        ],
      };

      // Сообщение с капчей
      const captchaMessage = await bot.sendMessage(
        chatId,
        `Привет, ${member.first_name}! Чтобы писать в чат, нажми на кнопку ниже.`,
        { reply_markup: keyboard }
      );

      // Таймер удаления
      const timeout = setTimeout(async () => {
        await bot.kickChatMember(chatId, userId).catch(console.error);
        await bot
          .deleteMessage(chatId, captchaMessage.message_id)
          .catch(console.error);
        pendingUsers.delete(userId);
      }, captchaTimeout);

      // Сохраняем пользователя
      pendingUsers.set(userId, { chatId, userId, timeout });
    }
  });

  // Обработка нажатий кнопок
  bot.on('callback_query', async (callbackQuery) => {
    const data = callbackQuery.data;

    if (!data || !data.startsWith('captcha_passed_')) return;

    const userId = parseInt(data.split('_')[2], 10);
    const pendingUser = pendingUsers.get(userId);

    if (!pendingUser) {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: 'Капча не найдена или время истекло.',
        show_alert: true,
      });
      return;
    }

    if (callbackQuery.from.id !== userId) {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: 'Эта капча не для вас.',
        show_alert: true,
      });
      return;
    }

    // Снимаем ограничения
    await bot
      .restrictChatMember(pendingUser.chatId, userId, fullPermissions)
      .catch(console.error);

    // Удаляем сообщение и данные
    await bot
      .deleteMessage(pendingUser.chatId, callbackQuery.message.message_id)
      .catch(console.error);
    clearTimeout(pendingUser.timeout);
    pendingUsers.delete(userId);

    await bot.answerCallbackQuery(callbackQuery.id, {
      text: 'Капча успешно пройдена! Добро пожаловать!',
    });
  });
};

// Экспортируем функцию
module.exports = { setupCaptcha };
