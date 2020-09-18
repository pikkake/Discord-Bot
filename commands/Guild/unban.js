const Discord = require('discord.js')
module.exports.run = async (bot, message, args, settings) => {
	//Check if user has permission to ban user
	if (message.deletable) message.delete()
	if (!message.member.hasPermission("BAN_MEMBERS")) {
		if (message.deletable) message.delete()
    message.channel.send({embed:{color:15158332, description:`${bot.config.emojis.cross} You are missing the permission: \`BAN_MEMBERS\`.`}}).then(m => m.delete({ timeout: 10000 }))
    return
	}
	//Check if bot has permission to unban user
	if (!message.guild.me.hasPermission("BAN_MEMBERS")) {
		if (message.deletable) message.delete()
		message.channel.send({embed:{color:15158332, description:`${bot.config.emojis.cross} I am missing the permission: \`BAN_MEMBERS\`.`}}).then(m => m.delete({ timeout: 10000 }))
		bot.logger.error(`Missing permission: \`BAN_MEMBERS\` in [${message.guild.id}]`)
		return
	}
	//Unban user
  let user = args[0]
	message.guild.fetchBans().then( bans => {
      if (bans.size == 0) return
      let bUser = bans.find(ban => ban.user.id == user)
      if (!bUser) return
      message.guild.members.unban(bUser.user)
			console.log(bUser)
			message.channel.send({embed:{color:3066993, description:`${bot.config.emojis.tick} *${bUser.user.username}#${bUser.user.discriminator} was successfully unbanned*.`}}).then(m => m.delete({ timeout: 3000 }))
	})
}
module.exports.config = {
	command: "unban",
	aliases: ["unban"]
}
module.exports.help = {
	name: "Unban",
	category: "Guild",
	description: "Unban a user.",
	usage: `!unban {user}`,
}