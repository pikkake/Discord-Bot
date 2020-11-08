// Dependecies
const logger = require('../modules/logging/logger');
const chalk = require('chalk');
const fetch = require('node-fetch');
const Discord = require('discord.js');
const Fortnite = require('fortnite');
const { KSoftClient } = require('@ksoft/api');

module.exports.run = async (config) => {
	// This will check if the config is correct
	logger.log('=-=-=-=-=-=-=- Config file Verification -=-=-=-=-=-=-=');
	logger.log('Verifing config..');
	let error;
	// check owner ID
	if (!config.ownerID) {
		logger.error(`${chalk.red('✗')} Bot ownerID is missing.`);
		error = true;
	}

	// check token
	if (!config.token) {
		logger.error(`${chalk.red('✗')} Bot token is missing.`);
		error = true;
	} else {
		const client = new Discord.Client();
		await client.login(config.token).catch(e => {
			if (e.message == 'An invalid token was provided.') {
				logger.error(`${chalk.red('✗')} Bot token is incorrect.`);
				error = true;
			}
		});
	}

	// Check twitch API
	if (!config.TwitchAPI) {
		logger.error(`${chalk.red('✗')} Twitch API key is missing.`);
		error = true;
	}

	// Check fortnite API
	if (!config.fortniteAPI) {
		logger.error(`${chalk.red('✗')} Fortnite API key is missing.`);
		error = true;
	} else {
		const stats = new Fortnite(config.fortniteAPI);
		await stats.user('Ninja', 'pc').catch(e => {
			if (e.message == 'Invalid authentication credentials') {
				logger.error(`${chalk.red('✗')} Fortnite API key is incorrect.`);
				error = true;
			}
		});
	}

	// Check Ksoft API
	if (!config.KSoftSiAPI) {
		logger.error(`${chalk.red('✗')} Ksoft API key is missing.`);
		error = true;
	} else {
		const ksoft = new KSoftClient(config.KSoftSiAPI);
		const resp = await ksoft.images.meme();
		if (!resp.url) {
			logger.error(`${chalk.red('✗')} Ksoft API key is incorrect.`);
			error = true;
		}
	}

	// Check Steam API
	if (!config.SteamAPI) {
		logger.error(`${chalk.red('✗')} Steam API key is missing.`);
		error = true;
	} else {
		try {
			await fetch(`http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${config.SteamAPI}&vanityurl=eroticgaben`).then(res => res.json());
		} catch (e) {
			if (e.type == 'invalid-json') {
				logger.error(`${chalk.red('✗')} Steam API key is incorrect.`);
				error = true;
			}
		}
	}

	// Check Youtube API
	if (!config.YoutubeAPI_Key) {
		logger.error(`${chalk.red('✗')} Youtube API key is missing.`);
		error = true;
	}

	// Check Soundcloud API
	if (!config.soundcloudAPI_Key) {
		logger.error(`${chalk.red('✗')} Soundcloud API key is missing.`);
		error = true;
	}

	// Check for bot list API keys
	if (config.DiscordBotLists) {
		// Check discord api
		if (!config.DiscordBotLists.DiscordBoatAPI_Key) {
			logger.log(`${chalk.red('✓')} Discord Boat API key is missing.`);
			error = true;
		}
		if (!config.DiscordBotLists.ArcaneBotAPI_KEY) {
			logger.log(`${chalk.red('✓')} Arcane Bot API key is missing.`);
			error = true;
		}
		if (!config.DiscordBotLists.botlist_spaceAPI_KEY) {
			logger.log(`${chalk.red('✓')} Botlist Space API key is missing.`);
			error = true;
		}
	}

	// Check Amethyste API
	if (!config.amethysteAPI_KEY) {
		logger.error(`${chalk.red('✗')} Amethyste API key is missing.`);
		error = true;
	} else {
		const res = await fetch('https://v1.api.amethyste.moe/generate/blurple', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${config.amethysteAPI_KEY}`,
			},
		});
		const result = await res.json();
		if (result.status === 401) {
			logger.error(`${chalk.red('✗')} Invalid Amethyste API key.`);
			error = true;
		}
	}

	// Check dashbaord
	if (!config.Dashboard) {
		logger.error(`${chalk.red('✗')} Dashboard setup is missing.`);
		error = true;
	}

	// Check support server set up
	if (!config.SupportServer) {
		logger.error(`${chalk.red('✗')} Support server setup is missing.`);
		error = true;
	}

	// Check fall back server settings setup
	if (!config.defaultSettings) {
		logger.error(`${chalk.red('✗')} Fallback server settings is missing.`);
		error = true;
	}

	// Check custom emojis
	if (!config.emojis) {
		logger.error(`${chalk.red('✗')} Custom emoji list is missing.`);
		error = true;
	}
	// Check mongodb connection
	if (!config.MongoDBURl) {
		logger.error(`${chalk.red('✗')} MongoDB URl is missing.`);
		error = true;
	} else {
		const mongoose = require('mongoose');
		await mongoose.connect(config.MongoDBURl, { useUnifiedTopology: true, useNewUrlParser: true }).catch(() => {
			logger.log(`${chalk.red('✗')} Unable to connect to database.`);
			error = true;
		});
	}

	// keep at end
	if (error != true) {
		logger.log(`${chalk.green('✓')} Config has been verified.`);
		error = false;
		return error;
	} else {
		logger.error(`${chalk.red('✗')} Config has errors to fix.`);
		return error;
	}
};