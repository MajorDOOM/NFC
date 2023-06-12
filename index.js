var ks = require('node-key-sender');
var crypto = require("crypto");
const { NFC } = require('nfc-pcsc');
const nfc = new NFC();
ks.setKeyboardLayout({
    '0': '@96',
    '1': '@97',
    '2': '@98',
    '3': '@99',
    '4': '@100',
    '5': '@101',
    '6': '@102',
    '7': '@103',
    '8': '@104',
    '9': '@105',
    'A': '@65',
    'B': '@66',
    'C': '@67',
    'D': '@68',
    'E': '@69',
    'F': '@70'
});

console.log('~~~~~~~~~~CSMA Card Reader 19/05/2023 (RDDC)~~~~~~~~~~');
nfc.on('reader', reader => {
	reader.autoProcessing = false;
	console.log(`${reader.reader.name}  device attached`);
	const send = async (cmd, comment = null, responseMaxLength = 40) => {
		const b = Buffer.from(cmd);
		const data = await reader.transmit(b, responseMaxLength);
		return data;
	};

	reader.on('card', async card => {
		//console.log(card);
		if (card.standard=="TAG_ISO_14443_3") {
			const step0 = async () => {
				const res = await send([0xFF, 0xCA, 0x00, 0x00, 0x00], 'Read OLD TAG ID...');
				if (!(res.slice(-2)[0] == 0x90 && res.slice(-1)[0] == 0x00))
					throw new Error('Bad ending...');
				var ID = res.slice(0, -2).toString('hex');
					console.log("ID: ",ID)
					ks.startBatch()
						.batchTypeText(ID)
						.batchTypeKey('shift',500)
						.batchTypeKey('enter')
						.sendBatch();
			};
			try {
				await step0();
			} catch (err) {
				console.error(err);
			}
		} else {
			const step0 = async () => {
				const res = await send([0xFF, 0xCA, 0x00, 0x00, 0x07], 'Read ID...');
				if (!(res.slice(-2)[0] == 0x90 && res.slice(-1)[0] == 0x00))
					throw new Error('Bad ending...');
				var ID = res.slice(0,7).toString("hex");
					console.log("ID: ",ID)
					ks.startBatch()
						.batchTypeText(ID)
						.batchTypeKey('shift',500)
						.batchTypeKey('enter')
						.sendBatch();
			};
			try {
				await step0();
			} catch (err) {
				console.error(err);
			}
		}
	});

	reader.on('card.off', card => {
		console.log(`${reader.reader.name}  card removed`);
	});

	reader.on('error', err => {
		console.log(`${reader.reader.name}  an error occurred`, err);
	});

	reader.on('end', () => {
		console.log(`${reader.reader.name}  device removed`);
	});

});

nfc.on('error', err => {
	console.log('an error occurred', err);
});