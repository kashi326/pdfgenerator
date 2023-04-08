const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const handlebars = require('handlebars');

const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json({limit: '50mb'}));
app.post('/convert-html', async (req, res) => {
	try {
		console.log("api hit");
		const html = req.body.html;
		const client_name = req.body.client_name.replace(' ', '-');
		const template = handlebars.compile(html, { strict: true });
		const compiledHtml = template({});

		// Launch a headless browser using Puppeteer
		const browser = await puppeteer.launch({ 
			headless: true,
			args: [ '--no-sandbox', '--disable-gpu','--disable-web-security'],
		 });
		const page = await browser.newPage();

		// Set the page content to the compiled HTML
		await page.setContent(compiledHtml, {timeout: 0})

		await page.emulateMediaType('print');
		

		const pdf = await page.pdf({
			format: 'A4',
			margin: {top: '30px', right: 0, bottom: 0, left: 0},
			preferCSSPageSize: true,
			printBackground: true,
		});
		await page.close()
		await browser.close()

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
