import { Client } from 'discord.js';
import axios from 'axios';

import config from '../config.json';

const client = new Client({
	ws: {
		compress: false,
		intents: 513,
	},
});

client.on('ready', () => {
	console.log('Ready!');
});

client.on('message', async (msg) => {
	// Cuz bot is guild-only
	if (!msg.guild) return;

	const prefix = config.prefix ? config.prefix : '';
	if (
		(prefix !== '' && !msg.content.toLowerCase().startsWith(prefix)) ||
		msg.author.bot
	)
		return;

	let args = msg.content.slice(prefix.length).trim().split(/ +/);

	const commandName = args.shift().toLowerCase();

	try {
		if (!msg.guild.me?.permissionsIn(msg.channel).has('SEND_MESSAGES'))
			return msg.author.send(
				`I cannot execute the command ${commandName} because I do not have the \`SEND_MESSAGES\` permission to send messages in ${msg.channel}!`,
			);

		switch (commandName) {
			case 'mkdir':
				await msg.guild.channels.create(args.join(' '), {
					type: 'category',
				});
				break;
			case 'touch':
				let name = args.join(' ');
				let categoryName = false;
				let categoryID = false;

				if (name.includes('/')) {
					const index = name.indexOf('/');
					categoryName = name.substr(0, index).toLowerCase();
					name = name.substr(index + 1);
				}
				if (categoryName) {
					const category = await msg.guild.channels.cache.find(
						(cat) => cat.name.toLowerCase() === categoryName,
					);

					if (category) categoryID = category.id;
				}

				// Due to some weird behavior, i have to manually post to the API
				if (categoryID === false) {
					await axios.post(
						`https://discord.com/api/v8/guilds/${msg.guild.id}/channels`,
						{
							name: name,
							type: 0,
						},
						{
							headers: {
								Authorization: `Bot ${config.token}`,
							},
						},
					);
				} else {
					await axios.post(
						`https://discord.com/api/v8/guilds/${msg.guild.id}/channels`,
						{
							name: name,
							type: 0,
							parent_id: categoryID,
						},
						{
							headers: {
								Authorization: `Bot ${config.token}`,
							},
						},
					);
				}
				break;
			default:
				break;
		}
	} catch (e) {
		msg.channel
			.send(
				`An error has occurred when running this command! Please inform the bot owner with this stack-trace or open an issue on the bots GitHub repo (<https://github.com/Relms12345/Unix-Discord-Bot-Thingy>)!\n\`\`\`${e.message} (${e.lineNumber})\`\`\``,
			)
			.catch(() =>
				msg.author.send(
					`An error has occurred when running this command! Please inform the bot owner with this stack-trace or open an issue on the bots GitHub repo (<https://github.com/Relms12345/Unix-Discord-Bot-Thingy>)!\n\`\`\`${e.message} (${e.lineNumber})\`\`\``,
				),
			);

		console.error(e);
		if (config.exitOnError) process.exit(1);
	}
});

client.login(config.token);
