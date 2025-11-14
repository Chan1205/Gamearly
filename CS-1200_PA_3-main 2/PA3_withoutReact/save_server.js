// Simple Node.js server to append user registration data to userInfoDB.txt
// No external dependencies (uses core modules only) so you can run with: node save_server.js
// Endpoint: POST http://localhost:3000/register  Body: { email, username, password }

const http = require('http');
const fs = require('fs');

const PORT = 3000;
const DB_FILE = __dirname + '/userInfoDB.txt';

function send(res, status, data, headers = {}) {
	res.writeHead(status, {
		'Content-Type': 'application/json',
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'POST,OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type',
		...headers,
	});
	res.end(JSON.stringify(data));
}

function sanitize(value) {
	if (typeof value !== 'string') return '';
	return value.replace(/[\r\n]/g, ' ').trim();
}

const server = http.createServer((req, res) => {
	if (req.method === 'OPTIONS') {
		// CORS preflight
		res.writeHead(204, {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'POST,OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type'
		});
		return res.end();
	}

	if (req.url === '/register' && req.method === 'POST') {
		let body = '';
		req.on('data', chunk => { body += chunk; });
		req.on('end', () => {
			let payload;
			try {
				payload = JSON.parse(body || '{}');
			} catch (e) {
				return send(res, 400, { ok: false, error: 'Invalid JSON' });
			}

			const email = sanitize(payload.email);
			const username = sanitize(payload.username);
			const password = sanitize(payload.password);

			if (!email || !username || !password) {
				return send(res, 400, { ok: false, error: 'All fields required' });
			}

			const line = `${email}\t${username}\t${password}\n`;
			fs.appendFile(DB_FILE, line, err => {
				if (err) return send(res, 500, { ok: false, error: 'Write failed' });
				return send(res, 200, { ok: true });
			});
		});
		return;
	}

	if (req.url === '/login' && req.method === 'POST') {
		let body = '';
		req.on('data', chunk => { body += chunk; });
		req.on('end', () => {
			let payload;
			try {
				payload = JSON.parse(body || '{}');
			} catch (e) {
				return send(res, 400, { ok: false, error: 'Invalid JSON' });
			}
			const username = (payload.username || '').trim();
			const password = payload.password || '';
			if (!username || !password) {
				return send(res, 400, { ok: false, error: 'Username and password required' });
			}
			fs.readFile(DB_FILE, 'utf8', (err, data) => {
				if (err) {
					if (err.code === 'ENOENT') return send(res, 404, { ok: false, error: 'Database empty' });
					return send(res, 500, { ok: false, error: 'Read failed' });
				}
				// Each line: email \t username \t password
				const lines = data.split(/\r?\n/).filter(l => l.trim().length > 0);
				for (const line of lines) {
					const parts = line.split('\t');
					if (parts.length >= 3) {
						const emailF = parts[0];
						const userF = parts[1];
						const passF = parts[2];
						if (userF === username && passF === password) {
							return send(res, 200, { ok: true, email: emailF, username: userF });
						} else if (userF === username && passF !== password) {
							return send(res, 401, { ok: false, error: 'Incorrect password' });
						}
					}
				}
				return send(res, 404, { ok: false, error: 'Username not found' });
			});
		});
		return;
	}

	if (req.url === '/reset-password' && req.method === 'POST') {
		let body = '';
		req.on('data', chunk => { body += chunk; });
		req.on('end', () => {
			let payload;
			try {
				payload = JSON.parse(body || '{}');
			} catch (e) {
				return send(res, 400, { ok: false, error: 'Invalid JSON' });
			}
			const email = (payload.email || '').trim();
			const username = (payload.username || '').trim();
			const newPassword = payload.newPassword || '';
			
			if (!email || !username || !newPassword) {
				return send(res, 400, { ok: false, error: 'All fields required' });
			}
			
			fs.readFile(DB_FILE, 'utf8', (err, data) => {
				if (err) {
					if (err.code === 'ENOENT') return send(res, 404, { ok: false, error: 'Database empty' });
					return send(res, 500, { ok: false, error: 'Read failed' });
				}
				
				const lines = data.split(/\r?\n/);
				let found = false;
				let updatedLines = [];
				
				for (const line of lines) {
					if (line.trim().length === 0) {
						updatedLines.push(line);
						continue;
					}
					const parts = line.split('\t');
					if (parts.length >= 3) {
						const emailF = parts[0];
						const userF = parts[1];
						
						if (emailF === email) {
							if (userF === username) {
								// Match found - update password
								updatedLines.push(`${emailF}\t${userF}\t${newPassword}`);
								found = true;
							} else {
								// Email matches but username doesn't
								updatedLines.push(line);
								return send(res, 400, { ok: false, error: 'Email and username do not match' });
							}
						} else {
							updatedLines.push(line);
						}
					} else {
						updatedLines.push(line);
					}
				}
				
				if (!found) {
					return send(res, 404, { ok: false, error: 'Email not found' });
				}
				
				// Write updated data back
				fs.writeFile(DB_FILE, updatedLines.join('\n'), err => {
					if (err) return send(res, 500, { ok: false, error: 'Update failed' });
					return send(res, 200, { ok: true });
				});
			});
		});
		return;
	}

	// Fallback
	send(res, 404, { ok: false, error: 'Not found' });
});

server.listen(PORT, () => {
	console.log(`Save server listening on http://localhost:${PORT}`);
	console.log('POST to /register with JSON { email, username, password }');
});

