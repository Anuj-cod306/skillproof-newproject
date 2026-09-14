import http from 'http';

function check(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      resolve(`${url} -> ${res.statusCode}`);
    }).on('error', (err) => {
      resolve(`${url} -> ERROR: ${err.message}`);
    });
  });
}

Promise.all([
  check('http://localhost:8080/api/skills/tree'),
  check('http://localhost:3000')
]).then((results) => {
  console.log(results.join('\n'));
});
