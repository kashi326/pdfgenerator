const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const handlebars = require('handlebars');
const xvfb = require('xvfb');

const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json({limit: '50mb'}));
app.post('/convert-html', async (req, res) => {
	try {
		console.log("api hit");
		const html = req.body.html;
		const client_name = req.body.client_name.replace(' ', '-');
		const xvfbOptions = {
			silent: false,
			xvfb_args: ['-screen', '0', '1280x1024x24'],
		};
		const xvfbDisplay = new xvfb(xvfbOptions);
		xvfbDisplay.startSync();

		// console.log(html,"htmlhtmlhtml");

		// Compile the HTML template using Handlebars
		const template = handlebars.compile(html, {strict: true});
		const compiledHtml = template({});

		// Launch a headless browser using Puppeteer
		const browser = await puppeteer.launch({
			args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', `--display=${xvfbDisplay.display}`],
			headless: true, devtools: false,
		});
		const page = await browser.newPage();

		// Set the page content to the compiled HTML
		await page.setContent(compiledHtml, {timeout: 0})

		// Add a style tag to the page
		// await page.addStyleTag({content: '@page { size: 210mm 240mm;margin: 0px !important;padding: 0px !important;}  .custom-print-page {width: 250mm !important;margin: auto !important;page-break-after: always !important; } .purple-logo {	bottom: -2mm !important;	transform: scale(1.045);	} .evelyn-footer {	height: auto !important; }'});
		await page.setCacheEnabled(false)
		page.setDefaultNavigationTimeout(60000);
		await page.emulateMediaType('print');

		// await page.evaluate(() => matchMedia('screen').matches);
		await page.screenshot({path: 'modified-page.png'});
		const pdf = await page.pdf({
			// format: 'A4',
			margin: {top: '30px', right: 0, bottom: 0, left: 0},
			preferCSSPageSize: true,
			printBackground: true,

			// scale: 1,
			// preferCSSPageSize: false,
			// width:'290mm',
			// height: '290mm',
			// height: 'auto'
		});
		await page.close()
		await browser.close()
		xvfbDisplay.stopSync();

		// Save the PDF to disk
		const fileName = `${client_name}.pdf`;
		res.setHeader('Content-Type', 'application/pdf');
		res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
		res.setHeader('Content-Length', pdf.length);
		res.send(pdf);

		// const pdfPath = path.join(__dirname, 'uploads', `${client_name}.pdf`);
		// res.setHeader('Content-Type', 'application/pdf');
		// res.sendFile(pdfPath);
	} catch (err) {
		console.error(err);
		res.status(500).json({error: 'Error generating PDF error: ' + err.message});
	}
});

app.get('/', async (req, res) => {
	try {
		res.json('server is running ');
	} catch (err) {
		console.error(err);
		res.status(500).json({error: 'Error generating PDF'});
	}
})

app.listen(5000, () => {
	console.log('Server listening on port 5000');
});
