import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ActivityType,
  Events
} from 'discord.js';
import { searchSyncedLyrics } from './lyrics.js';

const TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = process.env.GUILD_ID;

if (!TOKEN) {
  console.error('Thiếu DISCORD_TOKEN. Hãy cấu hình biến môi trường trước khi chạy.');
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const sessions = new Map();

const commands = [
  new SlashCommandBuilder()
    .setName('lyrics')
    .setDescription('Bắt đầu đồng bộ lyrics qua presence của bot')
    .addStringOption(o => o.setName('title').setDescription('Tên bài hát').setRequired(true))
    .addStringOption(o => o.setName('artist').setDescription('Tên ca sĩ/nghệ sĩ').setRequired(false)),
  new SlashCommandBuilder()
    .setName('stoplyrics')
    .setDescription('Dừng phiên đồng bộ lyrics hiện tại'),
  new SlashCommandBuilder()
    .setName('lyricstatus')
    .setDescription('Xem trạng thái phiên lyrics')
].map(command => command.toJSON());

async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  if (GUILD_ID) {
    await rest.put(Routes.applicationGuildCommands(client.user.id, GUILD_ID), { body: commands });
  } else {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
  }
}

function controls() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('lyrics:start').setLabel('🎵 Chạy Lyrics').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('lyrics:stop').setLabel('⏹ Dừng Lyrics').setStyle(ButtonStyle.Danger)
  );
}

function currentLine(lines, elapsed) {
  let index = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].time <= elapsed) index = i;
    else break;
  }
  return { index, line: lines[index] };
}

function stopSession(guildId) {
  const session = sessions.get(guildId);
  if (!session) return false;
  clearInterval(session.timer);
  sessions.delete(guildId);
  client.user.setPresence({ activities: [], status: 'online' });
  return true;
}

async function startSession(guildId, title, artist, lines, channel) {
  stopSession(guildId);

  const session = {
    title,
    artist,
    lines,
    startedAt: Date.now(),
    timer: null,
    channelId: channel.id,
    lastIndex: -1
  };

  const tick = async () => {
    const elapsed = (Date.now() - session.startedAt) / 1000;
    const { index, line } = currentLine(lines, elapsed);

    if (!line) {
      stopSession(guildId);
      return;
    }

    if (index !== session.lastIndex) {
      session.lastIndex = index;
      client.user.setPresence({
        status: 'online',
        activities: [{
          name: line.text.slice(0, 128),
          type: ActivityType.Custom,
          state: `🎵 ${title}${artist ? ` — ${artist}` : ''}`
        }]
      });

      try {
        await channel.send(`🎵 **${line.text}**`);
      } catch {
        // Không làm chết session nếu bot mất quyền gửi tin.
      }
    }
  };

  sessions.set(guildId, session);
  await tick();
  session.timer = setInterval(tick, 500);
}

client.once(Events.ClientReady, async ready => {
  console.log(`Đã đăng nhập bot: ${ready.user.tag}`);
  try {
    await registerCommands();
    console.log('Đã đăng ký slash commands.');
  } catch (error) {
    console.error('Không thể đăng ký slash commands:', error);
  }
});

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'lyrics') {
      await interaction.deferReply({ ephemeral: true });
      const title = interaction.options.getString('title', true);
      const artist = interaction.options.getString('artist') ?? '';

      try {
        const lines = await searchSyncedLyrics(title, artist);
        await startSession(interaction.guildId, title, artist, lines, interaction.channel);

        const embed = new EmbedBuilder()
          .setTitle('🎶 Lyrics Sync Status')
          .setDescription('Bot đang đồng bộ từng dòng lyrics theo timestamp.\n\n**Lưu ý:** phiên này chỉ điều khiển presence/tin nhắn của bot, không đọc hoặc thay đổi status tài khoản người dùng.')
          .addFields(
            { name: 'Bài hát', value: title, inline: true },
            { name: 'Nghệ sĩ', value: artist || 'Không rõ', inline: true },
            { name: 'Số dòng', value: String(lines.length), inline: true }
          );

        await interaction.editReply({ embeds: [embed], components: [controls()] });
      } catch (error) {
        await interaction.editReply(`❌ ${error.message}`);
      }
      return;
    }

    if (interaction.commandName === 'stoplyrics') {
      const stopped = stopSession(interaction.guildId);
      await interaction.reply({ content: stopped ? '⏹ Đã dừng Lyrics Sync.' : 'ℹ️ Không có phiên Lyrics Sync đang chạy.', ephemeral: true });
      return;
    }

    if (interaction.commandName === 'lyricstatus') {
      const session = sessions.get(interaction.guildId);
      if (!session) {
        await interaction.reply({ content: 'ℹ️ Hiện không có phiên lyrics nào đang chạy.', ephemeral: true });
        return;
      }
      await interaction.reply({
        content: `🎵 **${session.title}**${session.artist ? ` — ${session.artist}` : ''}\nĐã chạy ${Math.floor((Date.now() - session.startedAt) / 1000)} giây.`,
        ephemeral: true
      });
    }
    return;
  }

  if (interaction.isButton()) {
    if (interaction.customId === 'lyrics:stop') {
      const stopped = stopSession(interaction.guildId);
      await interaction.reply({ content: stopped ? '⏹ Đã dừng Lyrics Sync.' : 'ℹ️ Không có phiên đang chạy.', ephemeral: true });
    } else if (interaction.customId === 'lyrics:start') {
      await interaction.reply({ content: 'Dùng `/lyrics` để chọn tên bài hát và nghệ sĩ.', ephemeral: true });
    }
  }
});

process.on('SIGINT', () => {
  for (const guildId of sessions.keys()) stopSession(guildId);
  client.destroy();
  process.exit(0);
});

client.login(TOKEN);
