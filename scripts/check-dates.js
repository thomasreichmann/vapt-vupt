const axios = require('axios');
const qs = require('querystring');

const config = {
	tokenUrl: 'https://api.go.gov.br/token',
	apiUrl: 'https://api.go.gov.br/sigac/atendimentos/v1.0/agendamento/listarDatasAgendamento',
	clientId: process.env.CLIENT_ID,
	clientSecret: process.env.CLIENT_SECRET,
	discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL,
	discordUsers: process.env.DISCORD_USER_IDS?.split(',') || [],
	municipalities: [
		{ code: 25300, name: 'Municipality 1' },
		{ code: 25301, name: 'Municipality 2' },
		// Add more as needed
	],
};

// Helper function to send Discord notification
async function sendDiscordNotification(content) {
	try {
		// Create user mentions string
		const userMentions = config.discordUsers
			.map((userId) => `<@${userId}>`)
			.join(' ');

		await axios.post(config.discordWebhookUrl, {
			content: `${userMentions}\n\n${content}`,
			username: 'Notificações',
			// Makes sure mentions actually ping users
			allowed_mentions: {
				users: config.discordUsers,
			},
		});
		console.log('Discord notification sent successfully');
	} catch (error) {
		console.error('Error sending Discord notification:', error.message);
		throw error;
	}
}

async function getAccessToken() {
	try {
		const response = await axios({
			method: 'post',
			url: config.tokenUrl,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			data: qs.stringify({
				grant_type: 'client_credentials',
				client_id: config.clientId,
				client_secret: config.clientSecret,
			}),
		});

		return response.data.access_token;
	} catch (error) {
		console.error('Error getting access token:', error.message);
		throw error;
	}
}

async function checkDatesForMunicipality(accessToken, municipality) {
	try {
		const response = await axios({
			method: 'get',
			url: config.apiUrl,
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
			params: {
				idSenha: 58,
				status: 'D',
				codgMunicipio: municipality.code,
			},
		});

		const currentYear = new Date().getFullYear();
		const availableDates = [];

		response.data.forEach((unit) => {
			unit.datas.forEach((date) => {
				const [day, month, year] = date
					.split('/')
					.map((num) => parseInt(num));
				if (year === currentYear) {
					availableDates.push({
						date,
						formatted: new Date(
							year,
							month - 1,
							day
						).toLocaleDateString('pt-BR', {
							year: 'numeric',
							month: 'long',
							day: 'numeric',
						}),
					});
				}
			});
		});

		return {
			municipality,
			availableDates,
			hasAvailableDates: availableDates.length > 0,
		};
	} catch (error) {
		console.error(
			`Error checking dates for municipality ${municipality.code}:`,
			error.message
		);
		return {
			municipality,
			error: error.message,
			hasAvailableDates: false,
		};
	}
}

async function checkAllMunicipalities() {
	try {
		console.log('Starting date check for all municipalities...');

		const accessToken = await getAccessToken();
		const results = await Promise.all(
			config.municipalities.map((municipality) =>
				checkDatesForMunicipality(accessToken, municipality)
			)
		);

		// Process results
		const municipalitiesWithDates = results.filter(
			(result) => result.hasAvailableDates
		);
		const currentYear = new Date().getFullYear();

		// Prepare and send Discord message if dates are found
		if (municipalitiesWithDates.length > 0) {
			const message = [
				`🚨 **Novas datas!** 🚨`,
				`📅 Ano: **${currentYear}**\n`,
				...municipalitiesWithDates.map((result) => {
					const limit = 15;
					const dates = result.availableDates
						.slice(0, limit)
						.map((d) => d.formatted)
						.join('\n• ');

					return `**${result.municipality.name}**:\n• ${dates}${
						result.availableDates.length > limit
							? `\n_(+${
									result.availableDates.length - limit
							  } outras datas)_`
							: ''
					}`;
				}),
			].join('\n');

			await sendDiscordNotification(message);
		}

		// Console output
		console.log('\nResults:');
		console.log('========================================');

		results.forEach((result) => {
			console.log(
				`\n${result.municipality.name} (${result.municipality.code}):`
			);
			if (result.error) {
				console.log(`Error: ${result.error}`);
			} else if (result.hasAvailableDates) {
				console.log(`Found ${result.availableDates.length} dates:`);
				result.availableDates.forEach((d) =>
					console.log(`- ${d.formatted}`)
				);
			} else {
				console.log('No dates available');
			}
		});

		return {
			success: true,
			municipalitiesWithDates: municipalitiesWithDates.length,
			totalMunicipalities: results.length,
		};
	} catch (error) {
		console.error('Error in main process:', error.message);
		throw error;
	}
}

// Run the script
checkAllMunicipalities()
	.then((result) => {
		console.log('\nFinal Summary:');
		console.log('========================================');
		console.log(`Municipalities checked: ${result.totalMunicipalities}`);
		console.log(
			`Municipalities with available dates: ${result.municipalitiesWithDates}`
		);
		process.exit(result.municipalitiesWithDates > 0 ? 0 : 1);
	})
	.catch((error) => {
		console.error('Script failed:', error);
		process.exit(1);
	});
