//Dependencies
const Discord = require('discord.js')
const ytdl = require('ytdl-core')
const config = require("../../config.js");
const YouTubeAPI = require("simple-youtube-api");
const youtube = new YouTubeAPI(config.YoutubeAPI_Key);
const scdl = require("soundcloud-downloader");
var { getData, getPreview } = require("spotify-url-info");

module.exports.run = async (bot, message, args, settings, ops) => {
	//Checks to see if music is enabled or the server
  if (settings.MusicPlugin == false) {
		if (message.deletable) message.delete()
		message.channel.send({embed:{color:15158332, description:`${bot.config.emojis.cross} This plugin is currently disabled.`}}).then(m => m.delete({ timeout: 10000 }))
		return;
	}
  //Check if bot can see user in channel (the user is in a channel)
  if (!message.member.voice.channelID) {
		message.channel.send({embed:{color:15158332, description:`${bot.config.emojis.cross} You are not connected to a voice channel.`}}).then(m => m.delete({ timeout: 10000 }))
		message.delete()
		return
	}
  //Check if bot can join channel
  if (!message.guild.me.hasPermission("CONNECT")) {
		if (message.deletable) message.delete()
		message.channel.send({embed:{color:15158332, description:`${bot.config.emojis.cross} I am missing the permission: \`CONNECT\`.`}}).then(m => m.delete({ timeout: 10000 }))
		bot.logger.error(`Missing permission: \`CONNECT\` in [${message.guild.id}]`)
		return
	}
  //Check if bot can speak in channel
  if (!message.guild.me.hasPermission("SPEAK")) {
		if (message.deletable) message.delete()
		message.channel.send({embed:{color:15158332, description:`${bot.config.emojis.cross} I am missing the permission: \`SPEAK\`.`}}).then(m => m.delete({ timeout: 10000 }))
		bot.logger.error(`Missing permission: \`SPEAK\` in [${message.guild.id}]`)
		return
	}
  //Check if an 'entry' was added
  if (args.length == 0) return message.channel.send({embed:{color:15158332, description:`${bot.config.emojis.cross} Please use the format \`${bot.commands.get('play').help.usage}\`.`}}).then(m => m.delete({ timeout: 5000 }))

  //RegEx formulas
  const search = args.join(" ")
  const videoPattern = /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/gi;
  const playlistPattern = /^.*(list=)([^#\&\?]*).*/gi;
  const scRegex = /^https?:\/\/(soundcloud\.com)\/(.*)$/;
  const url = args[0];
  const urlValid = videoPattern.test(args[0]);

  //Check for playlist and play
  if (!videoPattern.test(args[0]) && playlistPattern.test(args[0])) {
    //This checks for youtube playlist
    return message.client.commands.get('add-playlist').run(bot, message, args, settings, ops)
  } else if (scdl.isValidUrl(url) && url.includes("/sets/")) {
    //This checks for soundcloud playlist
    return message.client.commands.get("add-playlist").run(bot, message, args, settings, ops)
  } else if (args[0].includes('open.spotify.com/album') || args[0].includes('spotify:album:') || args[0].includes('open.spotify.com/playlist') || args[0].includes('spotify:playlist:')) {
    //this checks for spotify
    return message.client.commands.get("add-playlist").run(bot, message, args, settings, ops)
  } else if (scRegex.test(url)) {
    //play soundcloud
    try {
        const trackInfo = await scdl.getInfo(url, bot.config.soundcloudAPI_Key);
        song = {
          title: trackInfo.title,
          url: trackInfo.permalink_url,
          duration: Math.ceil(trackInfo.duration / 1000),
          thumbnail: trackInfo.artwork_url
        };
      } catch (error) {
        if (error.statusCode === 404) {
          return message.reply("Could not find that Soundcloud track.").catch(console.error);
        }
        return message.reply("There was an error playing that Soundcloud track.").catch(console.error);
      }
  } else if (videoPattern.test(url)) {
    //Get youtube info directly from link
    try {
      var songInfo = await ytdl.getInfo(url)
      var song = {
        title: songInfo.videoDetails.title,
        url: songInfo.videoDetails.video_url,
        duration: songInfo.videoDetails.lengthSeconds,
        thumbnail: songInfo.videoDetails.thumbnail.thumbnails[songInfo.videoDetails.thumbnail.thumbnails.length-1].url
      }
    } catch (e) {
      console.log(e)
      return message.channel.send({embed:{color:15158332, description:`${bot.config.emojis.cross} Unable to find video with that song.`}}).then(m => m.delete({ timeout: 5000 }))
    }
  } else if (args[0].includes('open.spotify.com/track') || args[0].includes('spotify:track:')) {
    var spotifyData = await getData(url)
    var results = await youtube.searchVideos(`${spotifyData.name} | ${spotifyData.artists[0].name}`, 1)
    var songInfo = await ytdl.getInfo(results[0].url)
    var song = {
        title: songInfo.videoDetails.title,
        url: songInfo.videoDetails.video_url,
        duration: songInfo.videoDetails.lengthSeconds,
        thumbnail: songInfo.videoDetails.thumbnail.thumbnails[songInfo.videoDetails.thumbnail.thumbnails.length-1].url
    }
  } else {
    //search for song
    try {
      const results = await youtube.searchVideos(search, 1)
      var songInfo = await ytdl.getInfo(results[0].url)
      var song = {
        title: songInfo.videoDetails.title,
        url: songInfo.videoDetails.video_url,
        duration: songInfo.videoDetails.lengthSeconds,
        thumbnail: songInfo.videoDetails.thumbnail.thumbnails[songInfo.videoDetails.thumbnail.thumbnails.length-1].url
      }
    } catch (e) {
      console.log(e)
      return message.channel.send({embed:{color:15158332, description:`${bot.config.emojis.cross} Unable to find video with that song.`}}).then(m => m.delete({ timeout: 5000 }))
    }
  }
  //get server information & join channel
  let data = ops.active.get(message.guild.id) || {}
  if (!data.connection) data.connection = await message.member.voice.channel.join()
  data.connection.voice.setSelfDeaf(true)  //deafen self (recieve less information from discord)
  if (!data.queue) data.queue = []
  data.guildID = message.guild.id
  //add songs to queue
  data.queue.push({
      title: song.title,
      requester: message.author.id,
      url: song.url,
      duration: song.duration,
      thumbnail: song.thumbnail
  })
  ops.active.set(message.guild.id, data)
  r.delete({ timeout: 0})
  if (!data.dispatcher) {
    require('../../Utils/play.js').run(bot, ops, data, message)
  } else {
    //show that songs where added to queue
    var embed = new Discord.MessageEmbed()
      .setTitle("Added to queue")
  	  .setDescription(`[${song.title}](${song.url})`)
  		.addField("Song duration:", `${require('../../Utils/time.js').toHHMMSS(song.duration)}`, true)
  		.addField("Posititon in Queue:", `${data.queue.length}`, true)
  	message.channel.send(embed)
  }
}
module.exports.config = {
	command: "play",
	aliases: ["p"]
}
module.exports.help = {
	name: "play",
	category: "Music",
	description: "Plays a song",
	usage: '!play [link | song name]',
}